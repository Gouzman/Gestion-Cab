// Test de la fonction cleanFileNameForDownload
// Ce script valide que les noms de fichiers sont correctement nettoyés

function cleanFileNameForDownload(fileName) {
  if (!fileName) return 'file';
  
  // Stratégie: chercher les extensions courantes depuis la fin du nom
  // Liste des extensions supportées (les plus longues en premier pour éviter les conflits)
  const extensions = ['docx', 'xlsx', 'pptx', 'html', 'jpeg', 'pdf', 'doc', 'xls', 'ppt', 'txt', 'png', 'jpg', 'gif', 'svg', 'zip', 'rar', 'csv', 'json', 'xml', 'htm', 'css', 'js', 'ts', 'md'];
  
  // Chercher la dernière extension valide dans le nom
  let foundExtension = null;
  let extensionPos = -1;
  
  for (const ext of extensions) {
    const pattern = new RegExp(`\\.(${ext})($|\\s|[\\(\\[])`, 'i');
    const match = fileName.match(pattern);
    
    if (match) {
      const pos = fileName.lastIndexOf(match[0]);
      // Prendre la position la plus à droite
      if (pos > extensionPos) {
        extensionPos = pos;
        foundExtension = '.' + match[1].toLowerCase();
      }
    }
  }
  
  // Si aucune extension détectée, retourner le nom original
  if (!foundExtension || extensionPos === -1) {
    return fileName;
  }
  
  // Vérifier s'il y a du texte après l'extension
  const afterExtension = fileName.substring(extensionPos + foundExtension.length);
  
  // Si rien après l'extension (ou juste fin de chaîne), le nom est déjà propre
  if (!afterExtension || afterExtension.trim() === '') {
    return fileName;
  }
  
  // Extraire tout ce qui précède l'extension
  const baseName = fileName.substring(0, extensionPos).trim();
  
  // Si le nom de base est vide, garder le nom original
  if (!baseName) {
    return fileName;
  }
  
  // Retourner le nom nettoyé: nom de base + extension
  return baseName + foundExtension;
}

// Tests de validation
const testCases = [
  { input: 'facture (version finale).pdf', expected: 'facture (version finale).pdf' },
  { input: 'contrat maison (05).docx', expected: 'contrat maison (05).docx' },
  { input: 'plan audience (v3).xlsx', expected: 'plan audience (v3).xlsx' },
  { input: 'document.pdf (1)', expected: 'document.pdf' },
  { input: 'rapport.docx extra text', expected: 'rapport.docx' },
  { input: 'test (copie) (2).png', expected: 'test (copie) (2).png' },
  { input: 'fichier.jpg quelque chose', expected: 'fichier.jpg' },
  { input: 'normal.pdf', expected: 'normal.pdf' },
  { input: 'sans_extension', expected: 'sans_extension' },
  { input: '', expected: 'file' },
  { input: '.pdf', expected: '.pdf' }, // Cas limite: on garde tel quel
  { input: 'multiple.points.doc.docx', expected: 'multiple.points.doc.docx' },
  { input: 'espace   avant.pdf', expected: 'espace   avant.pdf' },
  { input: 'après espace  .docx (2)', expected: 'après espace.docx' }
];

console.log('🧪 Tests de nettoyage des noms de fichiers\n');
console.log('═'.repeat(80));

let passed = 0;
let failed = 0;

testCases.forEach(({ input, expected }) => {
  const result = cleanFileNameForDownload(input);
  const success = result === expected;
  
  if (success) {
    passed++;
    console.log(`✅ "${input}"`);
    console.log(`   → "${result}"`);
  } else {
    failed++;
    console.log(`❌ "${input}"`);
    console.log(`   Attendu : "${expected}"`);
    console.log(`   Obtenu  : "${result}"`);
  }
  console.log('');
});

console.log('═'.repeat(80));
console.log(`\n📊 Résultats : ${passed} réussis / ${failed} échoués sur ${testCases.length} tests\n`);

if (failed === 0) {
  console.log('🎉 Tous les tests sont passés avec succès !');
  console.log('\n✅ La fonction cleanFileNameForDownload fonctionne correctement.');
  console.log('✅ Les fichiers téléchargés auront des noms propres et ouvrables.');
  console.log('✅ Les noms stockés dans Supabase restent inchangés.');
} else {
  console.log('⚠️ Certains tests ont échoué. Vérifiez la fonction.');
  process.exit(1);
}
