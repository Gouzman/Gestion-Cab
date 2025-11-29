/**
 * Tests unitaires pour le helper de normalisation des noms de fichiers
 * 
 * Teste la fonction cleanFileNameForDownload qui :
 * - Supprime les parenthèses fermantes en fin de nom
 * - Retire les extensions parasites avant la vraie extension
 * - Préserve les parenthèses dans le nom (ex: "Facture (Client X).pdf")
 */

import { describe, it, expect } from 'vitest';
import { cleanFileNameForDownload } from '@/lib/filePreviewUtils';

describe('cleanFileNameForDownload', () => {
  it('devrait supprimer la parenthèse fermante finale', () => {
    expect(cleanFileNameForDownload('document.pdf)')).toBe('document.pdf');
    expect(cleanFileNameForDownload('test.docx  )')).toBe('test.docx');
  });

  it('devrait retirer les extensions parasites avant la vraie extension', () => {
    // Cas typiques rencontrés en production
    expect(cleanFileNameForDownload('rapport.pdf.docx')).toBe('rapport.docx');
    expect(cleanFileNameForDownload('test.pdf.docx)')).toBe('test.docx');
    expect(cleanFileNameForDownload('facture.doc.xlsx')).toBe('facture.xlsx');
    
    // Cas complexe avec plusieurs extensions parasites
    expect(
      cleanFileNameForDownload('1763030167069_BIBLE.pdf.docx)')
    ).toBe('1763030167069_BIBLE.docx');
  });

  it('devrait préserver les parenthèses dans le nom de fichier', () => {
    // Les parenthèses utilisées pour identifier un document sont légitimes
    expect(cleanFileNameForDownload('Facture (Client X).pdf')).toBe('Facture (Client X).pdf');
    expect(cleanFileNameForDownload('Document (v2).docx')).toBe('Document (v2).docx');
    expect(cleanFileNameForDownload('Rapport (final).pdf.xlsx')).toBe('Rapport (final).xlsx');
  });

  it('devrait gérer les cas limites correctement', () => {
    // Fichier sans extension
    expect(cleanFileNameForDownload('document')).toBe('document');
    
    // Nom vide ou null
    expect(cleanFileNameForDownload('')).toBe('file');
    expect(cleanFileNameForDownload(null)).toBe('file');
    
    // Extension seule
    expect(cleanFileNameForDownload('.pdf')).toBe('.pdf');
    
    // Nom de base vide après nettoyage
    expect(cleanFileNameForDownload('.pdf.docx')).toBe('file.docx');
  });

  it('ne devrait pas modifier un nom de fichier propre', () => {
    // Fichiers déjà corrects
    expect(cleanFileNameForDownload('rapport.pdf')).toBe('rapport.pdf');
    expect(cleanFileNameForDownload('contrat.docx')).toBe('contrat.docx');
    expect(cleanFileNameForDownload('facture_2024.xlsx')).toBe('facture_2024.xlsx');
  });

  it('devrait gérer les extensions multiples imbriquées', () => {
    // Supprimer récursivement toutes les extensions parasites
    expect(cleanFileNameForDownload('doc.pdf.doc.docx')).toBe('doc.docx');
    expect(cleanFileNameForDownload('test.xls.pdf.xlsx')).toBe('test.xlsx');
  });

  it('devrait conserver la casse de la vraie extension', () => {
    // La vraie extension est mise en minuscules
    expect(cleanFileNameForDownload('Document.PDF.DOCX')).toBe('Document.docx');
    expect(cleanFileNameForDownload('Rapport.pdf.XLSX')).toBe('Rapport.xlsx');
  });
});
