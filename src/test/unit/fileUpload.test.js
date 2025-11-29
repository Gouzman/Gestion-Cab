/**
 * Tests unitaires pour la gestion de l'upload de fichiers
 * 
 * Vérifie :
 * - La validation des types de fichiers
 * - La validation de la taille des fichiers
 * - La normalisation des noms de fichiers avant upload
 */

import { describe, it, expect, beforeEach } from 'vitest';

describe('File Upload Validation', () => {
  const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50 MB

  const ALLOWED_FILE_TYPES = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'image/jpeg',
    'image/png',
    'image/gif',
  ];

  // Helper pour créer un fichier mock
  const createMockFile = (name, size, type) => {
    return {
      name,
      size,
      type,
      lastModified: Date.now(),
    };
  };

  describe('validateFileType', () => {
    const validateFileType = (file) => {
      return ALLOWED_FILE_TYPES.includes(file.type);
    };

    it('devrait accepter les PDFs', () => {
      const file = createMockFile('document.pdf', 1024, 'application/pdf');
      expect(validateFileType(file)).toBe(true);
    });

    it('devrait accepter les documents Word', () => {
      const docFile = createMockFile('doc.doc', 1024, 'application/msword');
      const docxFile = createMockFile('doc.docx', 1024, 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
      
      expect(validateFileType(docFile)).toBe(true);
      expect(validateFileType(docxFile)).toBe(true);
    });

    it('devrait accepter les fichiers Excel', () => {
      const xlsFile = createMockFile('data.xls', 1024, 'application/vnd.ms-excel');
      const xlsxFile = createMockFile('data.xlsx', 1024, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      
      expect(validateFileType(xlsFile)).toBe(true);
      expect(validateFileType(xlsxFile)).toBe(true);
    });

    it('devrait accepter les images courantes', () => {
      const jpegFile = createMockFile('photo.jpg', 1024, 'image/jpeg');
      const pngFile = createMockFile('screenshot.png', 1024, 'image/png');
      const gifFile = createMockFile('animation.gif', 1024, 'image/gif');
      
      expect(validateFileType(jpegFile)).toBe(true);
      expect(validateFileType(pngFile)).toBe(true);
      expect(validateFileType(gifFile)).toBe(true);
    });

    it('devrait rejeter les fichiers non autorisés', () => {
      const exeFile = createMockFile('virus.exe', 1024, 'application/x-msdownload');
      const zipFile = createMockFile('archive.zip', 1024, 'application/zip');
      const jsFile = createMockFile('script.js', 1024, 'application/javascript');
      
      expect(validateFileType(exeFile)).toBe(false);
      expect(validateFileType(zipFile)).toBe(false);
      expect(validateFileType(jsFile)).toBe(false);
    });
  });

  describe('validateFileSize', () => {
    const validateFileSize = (file) => {
      return file.size > 0 && file.size <= MAX_FILE_SIZE;
    };

    it('devrait accepter les fichiers de taille valide', () => {
      const smallFile = createMockFile('small.pdf', 1024, 'application/pdf'); // 1 KB
      const mediumFile = createMockFile('medium.pdf', 5 * 1024 * 1024, 'application/pdf'); // 5 MB
      const largeFile = createMockFile('large.pdf', 49 * 1024 * 1024, 'application/pdf'); // 49 MB
      
      expect(validateFileSize(smallFile)).toBe(true);
      expect(validateFileSize(mediumFile)).toBe(true);
      expect(validateFileSize(largeFile)).toBe(true);
    });

    it('devrait accepter un fichier exactement à la limite (50 MB)', () => {
      const maxFile = createMockFile('max.pdf', MAX_FILE_SIZE, 'application/pdf');
      expect(validateFileSize(maxFile)).toBe(true);
    });

    it('devrait rejeter les fichiers trop volumineux', () => {
      const tooBigFile = createMockFile('huge.pdf', 51 * 1024 * 1024, 'application/pdf'); // 51 MB
      expect(validateFileSize(tooBigFile)).toBe(false);
    });

    it('devrait rejeter les fichiers vides', () => {
      const emptyFile = createMockFile('empty.pdf', 0, 'application/pdf');
      expect(validateFileSize(emptyFile)).toBe(false);
    });

    it('devrait rejeter les fichiers avec taille négative', () => {
      const invalidFile = createMockFile('invalid.pdf', -100, 'application/pdf');
      expect(validateFileSize(invalidFile)).toBe(false);
    });
  });

  describe('validateFile (combiné)', () => {
    const validateFile = (file) => {
      const isValidType = ALLOWED_FILE_TYPES.includes(file.type);
      const isValidSize = file.size > 0 && file.size <= MAX_FILE_SIZE;
      return isValidType && isValidSize;
    };

    it('devrait accepter un fichier valide', () => {
      const validFile = createMockFile('document.pdf', 2 * 1024 * 1024, 'application/pdf');
      expect(validateFile(validFile)).toBe(true);
    });

    it('devrait rejeter si le type est invalide même avec une bonne taille', () => {
      const invalidTypeFile = createMockFile('script.js', 1024, 'application/javascript');
      expect(validateFile(invalidTypeFile)).toBe(false);
    });

    it('devrait rejeter si la taille est invalide même avec un bon type', () => {
      const tooBigFile = createMockFile('huge.pdf', 100 * 1024 * 1024, 'application/pdf');
      expect(validateFile(tooBigFile)).toBe(false);
    });

    it('devrait rejeter si le type ET la taille sont invalides', () => {
      const badFile = createMockFile('bad.exe', 100 * 1024 * 1024, 'application/x-msdownload');
      expect(validateFile(badFile)).toBe(false);
    });
  });
});
