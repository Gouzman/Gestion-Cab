// server/index.js
import express from 'express';
import cors from 'cors';
import multer from 'multer';
import { spawn } from 'child_process';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import rateLimit from 'express-rate-limit';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3001;

// Configuration Rate Limiting pour sécuriser les endpoints sensibles
const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // Max 50 requêtes par IP par fenêtre de 15 min
  message: { 
    success: false, 
    error: 'Trop de requêtes, veuillez réessayer dans 15 minutes' 
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const healthLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 30, // Max 30 health checks par IP par minute
  standardHeaders: true,
  legacyHeaders: false,
});

// Configuration CORS stricte avec whitelist pour production
// En développement : accepte localhost
// En production : uniquement le domaine configuré
const getAllowedOrigins = () => {
  const isDev = process.env.NODE_ENV !== 'production';
  
  if (isDev) {
    // Mode développement : accepter localhost sur tous les ports
    return (origin) => {
      return !origin || 
             /^http:\/\/localhost(:\d+)?$/.test(origin) || 
             /^http:\/\/\[::\](:\d+)?$/.test(origin) ||
             /^http:\/\/127\.0\.0\.1(:\d+)?$/.test(origin);
    };
  } else {
    // Mode production : whitelist des domaines autorisés
    const productionOrigins = [
      'https://www.ges-cab.com',
      'https://ges-cab.com',
      process.env.VITE_PRODUCTION_URL,
    ].filter(Boolean); // Enlève les valeurs undefined
    
    return (origin) => {
      // Pas d'origin = même origine (autorisé)
      if (!origin) return true;
      // Vérifier si l'origin est dans la whitelist
      return productionOrigins.includes(origin);
    };
  }
};

app.use(cors({
  origin: (origin, callback) => {
    const isAllowed = getAllowedOrigins();
    
    if (isAllowed(origin)) {
      callback(null, true);
    } else {
      console.warn(`🚫 Origine bloquée par CORS: ${origin}`);
      callback(new Error('Non autorisé par CORS - origine non whitelistée'));
    }
  },
  methods: ['POST', 'GET', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Accept', 'Cache-Control'],
  credentials: false // Pas de credentials pour éviter les complications CORS
}));

// Configuration de multer pour l'upload temporaire
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const tempDir = path.join(__dirname, 'temp');
    try {
      await fs.mkdir(tempDir, { recursive: true });
      cb(null, tempDir);
    } catch (error) {
      cb(error, null);
    }
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50 MB max
  fileFilter: (req, file, cb) => {
    // Accepter PDFs et documents Word
    const isPdf = file.mimetype === 'application/pdf' || file.originalname.toLowerCase().endsWith('.pdf');
    const isWord = [
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ].includes(file.mimetype) || /\.(doc|docx)$/i.test(file.originalname);
    
    if (isPdf || isWord) {
      cb(null, true);
    } else {
      cb(new Error('Seuls les fichiers PDF et Word (.doc, .docx) sont acceptés'), false);
    }
  }
});

/**
 * Normalise un PDF avec Ghostscript
 * Intègre toutes les polices et rend le PDF compatible avec PDF.js
 * Utilise spawn() au lieu de exec() pour éviter les injections shell
 */
async function normalizePdf(inputPath) {
  const outputPath = inputPath.replace('.pdf', '_normalized.pdf');

  // Arguments Ghostscript pour normaliser le PDF
  // -dNOPAUSE : Ne pas faire de pause entre les pages
  // -dBATCH : Traiter les fichiers et quitter
  // -sDEVICE=pdfwrite : Sortie en PDF
  // -dEmbedAllFonts=true : Intégrer toutes les polices
  // -dSubsetFonts=false : Ne pas créer de sous-ensembles de polices
  // -dPDFSETTINGS=/prepress : Qualité maximale pour impression professionnelle
  // -dCompatibilityLevel=1.4 : Version PDF 1.4 (compatible avec PDF.js)
  const args = [
    '-dNOPAUSE',
    '-dBATCH',
    '-sDEVICE=pdfwrite',
    '-dEmbedAllFonts=true',
    '-dSubsetFonts=false',
    '-dPDFSETTINGS=/prepress',
    '-dCompatibilityLevel=1.4',
    `-sOutputFile=${outputPath}`,
    inputPath
  ];

  return new Promise((resolve, reject) => {
    const gs = spawn('gs', args);
    let stderr = '';

    gs.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    gs.on('error', (error) => {
      console.error('❌ Erreur Ghostscript:', error.message);
      reject(new Error('Ghostscript non trouvé ou erreur de lancement: ' + error.message));
    });

    gs.on('close', async (code) => {
      if (code !== 0) {
        console.error('❌ Erreur Ghostscript (code ' + code + '):', stderr);
        reject(new Error('Erreur Ghostscript (code ' + code + ')'));
        return;
      }

      try {
        // Vérifier que le fichier normalisé existe et n'est pas vide
        const stats = await fs.stat(outputPath);
        if (stats.size < 100) {
          reject(new Error('PDF normalisé invalide (taille < 100 bytes)'));
          return;
        }

        console.log(`✅ PDF normalisé: ${path.basename(inputPath)} (${stats.size} bytes)`);
        resolve({ 
          original: inputPath, 
          normalized: outputPath,
          size: stats.size 
        });
      } catch (statError) {
        reject(new Error('Fichier normalisé introuvable: ' + statError.message));
      }
    });
  });
}

/**
 * Convertit un document Word en PDF avec LibreOffice
 * Utilise spawn() au lieu de exec() pour éviter les injections shell
 */
async function convertWordToPdf(inputPath) {
  const outputDir = path.dirname(inputPath);
  const baseName = path.basename(inputPath, path.extname(inputPath));
  const outputPath = path.join(outputDir, `${baseName}.pdf`);

  // Arguments LibreOffice pour convertir Word → PDF
  // --headless : Mode sans interface graphique
  // --convert-to pdf : Convertir au format PDF
  // --outdir : Dossier de sortie
  const args = [
    '--headless',
    '--convert-to',
    'pdf',
    '--outdir',
    outputDir,
    inputPath
  ];

  return new Promise((resolve, reject) => {
    const soffice = spawn('soffice', args);
    let stderr = '';

    soffice.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    soffice.on('error', (error) => {
      console.error('❌ Erreur LibreOffice:', error.message);
      reject(new Error('LibreOffice non trouvé ou erreur de lancement: ' + error.message));
    });

    soffice.on('close', async (code) => {
      if (code !== 0) {
        console.error('❌ Erreur LibreOffice (code ' + code + '):', stderr);
        reject(new Error('Erreur LibreOffice (code ' + code + ')'));
        return;
      }

      try {
        // Vérifier que le fichier PDF existe et n'est pas vide
        const stats = await fs.stat(outputPath);
        if (stats.size < 100) {
          reject(new Error('PDF converti invalide (taille < 100 bytes)'));
          return;
        }

        console.log(`✅ Word converti en PDF: ${path.basename(inputPath)} → ${path.basename(outputPath)} (${stats.size} bytes)`);
        resolve({ 
          original: inputPath, 
          converted: outputPath,
          size: stats.size 
        });
      } catch (statError) {
        reject(new Error('Fichier converti introuvable: ' + statError.message));
      }
    });
  });
}

/**
 * Endpoint de conversion Word → PDF
 * Protégé par rate limiting
 */
app.post('/convert-word-to-pdf', uploadLimiter, upload.single('file'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ 
      success: false, 
      error: 'Aucun fichier reçu' 
    });
  }

  const inputPath = req.file.path;
  const isWordDoc = /\.(doc|docx)$/i.test(req.file.originalname);

  if (!isWordDoc) {
    try {
      await fs.unlink(inputPath);
    } catch (e) {}
    return res.status(400).json({ 
      success: false, 
      error: 'Le fichier doit être un document Word (.doc ou .docx)' 
    });
  }

  console.log(`📄 Réception du document Word: ${req.file.originalname} (${req.file.size} bytes)`);

  try {
    // Convertir Word → PDF avec LibreOffice
    const result = await convertWordToPdf(inputPath);

    // Lire le fichier PDF converti
    const pdfData = await fs.readFile(result.converted);

    // Nettoyer les fichiers temporaires
    try {
      await fs.unlink(inputPath);
      await fs.unlink(result.converted);
    } catch (cleanupError) {
      console.warn('⚠️ Erreur lors du nettoyage:', cleanupError.message);
    }

    // Envoyer le PDF converti
    const pdfFileName = req.file.originalname.replace(/\.(doc|docx)$/i, '.pdf');
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Length': pdfData.length,
      'Content-Disposition': `attachment; filename="${pdfFileName}"`
    });
    
    console.log(`✅ PDF converti envoyé: ${pdfData.length} bytes`);
    res.send(pdfData);

  } catch (error) {
    console.error('❌ Erreur de conversion:', error.message);
    
    // Nettoyer le fichier d'entrée en cas d'erreur
    try {
      await fs.unlink(inputPath);
    } catch (cleanupError) {
      // Ignorer les erreurs de nettoyage
    }

    res.status(500).json({ 
      success: false, 
      error: 'Erreur lors de la conversion: ' + error.message 
    });
  }
});

/**
 * Endpoint de normalisation PDF
 * Protégé par rate limiting
 */
app.post('/normalize-pdf', uploadLimiter, upload.single('file'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ 
      success: false, 
      error: 'Aucun fichier reçu' 
    });
  }

  const inputPath = req.file.path;
  console.log(`📄 Réception du PDF: ${req.file.originalname} (${req.file.size} bytes)`);

  try {
    // Normaliser le PDF avec Ghostscript
    const result = await normalizePdf(inputPath);

    // Lire le fichier normalisé
    const normalizedData = await fs.readFile(result.normalized);

    // Nettoyer les fichiers temporaires
    try {
      await fs.unlink(inputPath);
      await fs.unlink(result.normalized);
    } catch (cleanupError) {
      console.warn('⚠️ Erreur lors du nettoyage:', cleanupError.message);
    }

    // Envoyer le PDF normalisé
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Length': normalizedData.length,
      'Content-Disposition': `attachment; filename="${req.file.originalname.replace('.pdf', '_normalized.pdf')}"`
    });
    
    console.log(`✅ PDF normalisé envoyé: ${normalizedData.length} bytes`);
    res.send(normalizedData);

  } catch (error) {
    console.error('❌ Erreur de normalisation:', error.message);
    
    // Nettoyer le fichier d'entrée en cas d'erreur
    try {
      await fs.unlink(inputPath);
    } catch (cleanupError) {
      // Ignorer les erreurs de nettoyage
    }

    res.status(500).json({ 
      success: false, 
      error: 'Erreur lors de la normalisation: ' + error.message 
    });
  }
});

/**
 * Endpoint de health check
 * Protégé par rate limiting
 * Utilise spawn() au lieu de exec() pour éviter les injections shell
 */
app.get('/health', healthLimiter, async (req, res) => {
  try {
    // Headers CORS explicites pour le health check
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Accept');
    
    // Vérifier que Ghostscript est disponible
    const checkGs = () => new Promise((resolve) => {
      const gs = spawn('gs', ['--version']);
      let stdout = '';
      gs.stdout.on('data', (data) => { stdout += data.toString(); });
      gs.on('error', () => resolve({ available: false, error: 'Ghostscript non trouvé' }));
      gs.on('close', (code) => {
        if (code === 0) {
          resolve({ available: true, version: stdout.trim() });
        } else {
          resolve({ available: false, error: 'Erreur Ghostscript' });
        }
      });
      
      // Timeout de 3 secondes
      setTimeout(() => {
        gs.kill();
        resolve({ available: false, error: 'Timeout Ghostscript' });
      }, 3000);
    });

    // Vérifier que LibreOffice est disponible
    const checkLo = () => new Promise((resolve) => {
      const soffice = spawn('soffice', ['--version']);
      let stdout = '';
      soffice.stdout.on('data', (data) => { stdout += data.toString(); });
      soffice.on('error', () => resolve({ available: false, error: 'LibreOffice non trouvé' }));
      soffice.on('close', (code) => {
        if (code === 0) {
          resolve({ available: true, version: stdout.trim() });
        } else {
          resolve({ available: false, error: 'Erreur LibreOffice' });
        }
      });
      
      // Timeout de 3 secondes
      setTimeout(() => {
        soffice.kill();
        resolve({ available: false, error: 'Timeout LibreOffice' });
      }, 3000);
    });

    const [gsResult, loResult] = await Promise.all([checkGs(), checkLo()]);

    // Toujours retourner 200 OK pour éviter les erreurs dans le navigateur
    // Le client vérifiera le champ 'status' pour connaître l'état réel
    if (!gsResult.available && !loResult.available) {
      res.status(200).json({
        status: 'error',
        message: 'Ghostscript et LibreOffice non disponibles',
        ghostscript: gsResult.error,
        libreoffice: loResult.error
      });
    } else if (!gsResult.available) {
      res.status(200).json({
        status: 'partial',
        message: 'Ghostscript non disponible (conversion Word → PDF disponible)',
        libreoffice_version: loResult.version,
        ghostscript: gsResult.error
      });
    } else if (!loResult.available) {
      res.status(200).json({
        status: 'partial',
        message: 'LibreOffice non disponible (normalisation PDF disponible)',
        ghostscript_version: gsResult.version,
        libreoffice: loResult.error
      });
    } else {
      res.status(200).json({
        status: 'ok',
        ghostscript_version: gsResult.version,
        libreoffice_version: loResult.version,
        message: 'Service de conversion et normalisation opérationnel'
      });
    }
  } catch (error) {
    console.error('❌ Erreur dans health check:', error);
    res.status(200).json({
      status: 'error',
      message: 'Erreur lors de la vérification du service',
      error: error.message
    });
  }
});

/**
 * Nettoyage périodique des fichiers temporaires (toutes les heures)
 */
setInterval(async () => {
  const tempDir = path.join(__dirname, 'temp');
  try {
    const files = await fs.readdir(tempDir);
    const now = Date.now();
    const oneHourAgo = now - (60 * 60 * 1000);

    for (const file of files) {
      const filePath = path.join(tempDir, file);
      const stats = await fs.stat(filePath);
      
      // Supprimer les fichiers de plus d'1 heure
      if (stats.mtimeMs < oneHourAgo) {
        await fs.unlink(filePath);
        console.log(`🗑️ Fichier temporaire nettoyé: ${file}`);
      }
    }
  } catch (error) {
    console.warn('⚠️ Erreur lors du nettoyage:', error.message);
  }
}, 60 * 60 * 1000); // Toutes les heures

// Démarrage du serveur
app.listen(PORT, () => {
  console.log(`🚀 Service de conversion et normalisation démarré sur le port ${PORT}`);
  console.log(`📍 Endpoints:`);
  console.log(`   - Word → PDF: http://localhost:${PORT}/convert-word-to-pdf (rate limited: 50/15min)`);
  console.log(`   - Normalisation PDF: http://localhost:${PORT}/normalize-pdf (rate limited: 50/15min)`);
  console.log(`🏥 Health check: http://localhost:${PORT}/health (rate limited: 30/min)`);
  console.log(`🔒 Sécurité: spawn() utilisé + rate limiting activé`);
  
  // Vérifier Ghostscript au démarrage (avec spawn)
  const gs = spawn('gs', ['--version']);
  let gsVersion = '';
  gs.stdout.on('data', (data) => { gsVersion += data.toString(); });
  gs.on('error', () => {
    console.error('❌ ERREUR: Ghostscript non trouvé!');
    console.error('Installez Ghostscript: brew install ghostscript');
  });
  gs.on('close', (code) => {
    if (code === 0) {
      console.log(`✅ Ghostscript ${gsVersion.trim()} détecté`);
    }
  });
  
  // Vérifier LibreOffice au démarrage (avec spawn)
  const soffice = spawn('soffice', ['--version']);
  let loVersion = '';
  soffice.stdout.on('data', (data) => { loVersion += data.toString(); });
  soffice.on('error', () => {
    console.error('❌ ERREUR: LibreOffice non trouvé!');
    console.error('Installez LibreOffice: brew install --cask libreoffice');
  });
  soffice.on('close', (code) => {
    if (code === 0) {
      console.log(`✅ LibreOffice ${loVersion.trim()} détecté`);
    }
  });
});
