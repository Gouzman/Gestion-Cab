// server/index.js
import express from 'express';
import cors from 'cors';
import multer from 'multer';
import { exec } from 'child_process';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3001;

// Configuration CORS pour accepter les requêtes depuis le front-end
// Accepte localhost sur tous les ports (3000, 3002, etc.)
app.use(cors({
  origin: (origin, callback) => {
    // Accepter toutes les requêtes depuis localhost (n'importe quel port)
    if (!origin || /^http:\/\/localhost(:\d+)?$/.test(origin) || /^http:\/\/\[::\](:\d+)?$/.test(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Non autorisé par CORS'));
    }
  },
  methods: ['POST', 'GET', 'OPTIONS'],
  allowedHeaders: ['Content-Type'],
  credentials: true
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
 */
async function normalizePdf(inputPath) {
  const outputPath = inputPath.replace('.pdf', '_normalized.pdf');

  // Commande Ghostscript pour normaliser le PDF
  // -dNOPAUSE : Ne pas faire de pause entre les pages
  // -dBATCH : Traiter les fichiers et quitter
  // -sDEVICE=pdfwrite : Sortie en PDF
  // -dEmbedAllFonts=true : Intégrer toutes les polices
  // -dSubsetFonts=false : Ne pas créer de sous-ensembles de polices
  // -dPDFSETTINGS=/prepress : Qualité maximale pour impression professionnelle
  // -dCompatibilityLevel=1.4 : Version PDF 1.4 (compatible avec PDF.js)
  const cmd = `gs -dNOPAUSE -dBATCH -sDEVICE=pdfwrite \
    -dEmbedAllFonts=true -dSubsetFonts=false \
    -dPDFSETTINGS=/prepress -dCompatibilityLevel=1.4 \
    -sOutputFile="${outputPath}" "${inputPath}"`;

  return new Promise((resolve, reject) => {
    exec(cmd, async (error, stdout, stderr) => {
      if (error) {
        console.error('❌ Erreur Ghostscript:', error.message);
        console.error('stderr:', stderr);
        reject(new Error('Erreur Ghostscript: ' + error.message));
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
 */
async function convertWordToPdf(inputPath) {
  const outputDir = path.dirname(inputPath);
  const baseName = path.basename(inputPath, path.extname(inputPath));
  const outputPath = path.join(outputDir, `${baseName}.pdf`);

  // Commande LibreOffice pour convertir Word → PDF
  // --headless : Mode sans interface graphique
  // --convert-to pdf : Convertir au format PDF
  // --outdir : Dossier de sortie
  const cmd = `soffice --headless --convert-to pdf --outdir "${outputDir}" "${inputPath}"`;

  return new Promise((resolve, reject) => {
    exec(cmd, async (error, stdout, stderr) => {
      if (error) {
        console.error('❌ Erreur LibreOffice:', error.message);
        console.error('stderr:', stderr);
        reject(new Error('Erreur LibreOffice: ' + error.message));
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
 */
app.post('/convert-word-to-pdf', upload.single('file'), async (req, res) => {
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
 */
app.post('/normalize-pdf', upload.single('file'), async (req, res) => {
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
 */
app.get('/health', (req, res) => {
  // Vérifier que Ghostscript et LibreOffice sont disponibles
  exec('gs --version', (gsError, gsStdout) => {
    exec('soffice --version', (loError, loStdout) => {
      const gsAvailable = !gsError;
      const loAvailable = !loError;
      
      if (!gsAvailable && !loAvailable) {
        res.status(500).json({
          status: 'error',
          message: 'Ghostscript et LibreOffice non disponibles',
          ghostscript: gsError?.message,
          libreoffice: loError?.message
        });
      } else if (!gsAvailable) {
        res.status(500).json({
          status: 'partial',
          message: 'Ghostscript non disponible (conversion Word → PDF disponible)',
          libreoffice_version: loStdout.trim(),
          ghostscript: gsError?.message
        });
      } else if (!loAvailable) {
        res.status(500).json({
          status: 'partial',
          message: 'LibreOffice non disponible (normalisation PDF disponible)',
          ghostscript_version: gsStdout.trim(),
          libreoffice: loError?.message
        });
      } else {
        res.json({
          status: 'ok',
          ghostscript_version: gsStdout.trim(),
          libreoffice_version: loStdout.trim(),
          message: 'Service de conversion et normalisation opérationnel'
        });
      }
    });
  });
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
  console.log(`   - Word → PDF: http://localhost:${PORT}/convert-word-to-pdf`);
  console.log(`   - Normalisation PDF: http://localhost:${PORT}/normalize-pdf`);
  console.log(`🏥 Health check: http://localhost:${PORT}/health`);
  
  // Vérifier Ghostscript et LibreOffice au démarrage
  exec('gs --version', (gsError, gsStdout) => {
    if (gsError) {
      console.error('❌ ERREUR: Ghostscript non trouvé!');
      console.error('Installez Ghostscript: brew install ghostscript');
    } else {
      console.log(`✅ Ghostscript ${gsStdout.trim()} détecté`);
    }
  });
  
  exec('soffice --version', (loError, loStdout) => {
    if (loError) {
      console.error('❌ ERREUR: LibreOffice non trouvé!');
      console.error('Installez LibreOffice: brew install --cask libreoffice');
    } else {
      console.log(`✅ LibreOffice ${loStdout.trim()} détecté`);
    }
  });
});
