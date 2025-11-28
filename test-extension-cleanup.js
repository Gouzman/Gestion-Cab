// Test de validation de la fonction de nettoyage des extensions parasites
// Valide que seule la vraie extension est conservée

console.log('🧪 Test de nettoyage des extensions parasites\n');
console.log('═'.repeat(80));

// Copie de la fonction corrigée
function cleanFileNameForDownload(fileName) {
  if (!fileName) return 'file';
  
  // Étape 1: Retirer la parenthèse fermante finale si présente
  let cleaned = fileName.trim();
  if (cleaned.endsWith(')')) {
    cleaned = cleaned.slice(0, -1).trim();
  }
  
  // Étape 2: Extraire la vraie extension (après le dernier point)
  const lastDotIndex = cleaned.lastIndexOf('.');
  
  // Si pas d'extension, retourner le nom nettoyé
  if (lastDotIndex === -1 || lastDotIndex === 0) {
    return cleaned;
  }
  
  const trueExtension = cleaned.substring(lastDotIndex + 1).toLowerCase();
  let baseName = cleaned.substring(0, lastDotIndex);
  
  // Étape 3: Supprimer toutes les extensions parasites connues du nom de base
  // Liste des extensions courantes à supprimer si elles apparaissent avant la vraie extension
  const parasiteExtensions = ['pdf', 'docx', 'doc', 'xlsx', 'xls', 'pptx', 'ppt', 
                              'txt', 'png', 'jpg', 'jpeg', 'gif', 'svg', 'zip', 
                              'rar', 'csv', 'json', 'xml', 'html', 'htm'];
  
  // Retirer récursivement les extensions parasites à la fin du nom de base
  let previousBaseName = '';
  while (baseName !== previousBaseName) {
    previousBaseName = baseName;
    
    // Vérifier si le nom de base se termine par .extension_parasite
    for (const ext of parasiteExtensions) {
      const pattern = new RegExp(`\\.${ext}$`, 'i');
      if (pattern.test(baseName)) {
        baseName = baseName.substring(0, baseName.lastIndexOf('.'));
        break;
      }
    }
  }
  
  // Si le nom de base est vide après nettoyage, utiliser un nom par défaut
  if (!baseName || baseName.trim() === '') {
    return `file.${trueExtension}`;
  }
  
  // Étape 4: Reconstruire le nom propre
  return `${baseName}.${trueExtension}`;
}

// Cas de test spécifiques mentionnés dans la demande
const testCases = [
  // Cas principaux de la demande
  { 
    input: '1763030167069_BIBLE_CHAMPIONS_LEAGUE-CONCOURS_BIBLIQUE-MANCHE_ELIMINATOIRE_2025_normalized.pdf.docx)', 
    expected: '1763030167069_BIBLE_CHAMPIONS_LEAGUE-CONCOURS_BIBLIQUE-MANCHE_ELIMINATOIRE_2025_normalized.docx' 
  },
  { input: 'test.pdf.docx)', expected: 'test.docx' },
  { input: 'rapport(final).pdf.docx', expected: 'rapport(final).docx' },
  { input: 'preuve(02).xlsx)', expected: 'preuve(02).xlsx' },
  
  // Extensions multiples parasites
  { input: 'document.pdf.png.docx', expected: 'document.docx' },
  { input: 'fichier.doc.pdf.xlsx)', expected: 'fichier.xlsx' },
  
  // Sans extensions parasites (ne doivent pas être modifiés)
  { input: 'Facture (Client X).pdf', expected: 'Facture (Client X).pdf' },
  { input: 'Rapport final.docx', expected: 'Rapport final.docx' },
  { input: 'simple.txt', expected: 'simple.txt' },
  
  // Cas limites
  { input: 'sans_extension', expected: 'sans_extension' },
  { input: '.hidden.pdf', expected: '.hidden.pdf' },
  { input: 'multiple.points.dans.le.nom.pdf.docx)', expected: 'multiple.points.dans.le.nom.docx' },
  
  // Cas avec espaces et parenthèses
  { input: 'Document (version 2).pdf.docx)', expected: 'Document (version 2).docx' },
  { input: 'Facture finale.pdf.xlsx', expected: 'Facture finale.xlsx' },
];

console.log('\n📋 Tests de validation\n');

let passed = 0;
let failed = 0;

testCases.forEach(({ input, expected }, index) => {
  const result = cleanFileNameForDownload(input);
  const success = result === expected;
  
  if (success) {
    passed++;
    console.log(`✅ Test ${index + 1} réussi`);
    console.log(`   Entrée:   "${input}"`);
    console.log(`   Sortie:   "${result}"`);
  } else {
    failed++;
    console.log(`❌ Test ${index + 1} échoué`);
    console.log(`   Entrée:   "${input}"`);
    console.log(`   Attendu:  "${expected}"`);
    console.log(`   Obtenu:   "${result}"`);
  }
  console.log('');
});

console.log('═'.repeat(80));
console.log(`\n📊 Résultats : ${passed} réussis / ${failed} échoués sur ${testCases.length} tests\n`);

if (failed === 0) {
  console.log('🎉 Tous les tests sont passés avec succès !');
  console.log('\n✅ La fonction cleanFileNameForDownload fonctionne correctement.');
  console.log('✅ Les extensions parasites sont supprimées.');
  console.log('✅ Seule la vraie extension est conservée.');
  console.log('✅ Les parenthèses fermantes finales sont retirées.');
} else {
  console.log('⚠️ Certains tests ont échoué. Vérifiez la fonction.');
  process.exit(1);
}
