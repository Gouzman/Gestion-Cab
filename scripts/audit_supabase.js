#!/usr/bin/env node

/**
 * SCRIPT D'AUDIT SUPABASE
 * 
 * Objectif : Vérifier l'existence et la configuration des éléments
 *            sans rien créer, modifier ou supprimer
 * 
 * Date: 2025-11-26
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Configuration Supabase depuis .env.local
const SUPABASE_URL = 'https://fhuzkubnxuetakpxkwlr.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZodXprdWJueHVldGFrcHhrd2xyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTExMTgxMSwiZXhwIjoyMDc0Njg3ODExfQ.o-OA-PA49ZR_zy-uaHt0viyAbVCMI2UXTMjix7t1Bqc';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

console.log('\n' + '='.repeat(70));
console.log('         🔍 AUDIT SUPABASE - LECTURE SEULE');
console.log('='.repeat(70));
console.log(`Date: ${new Date().toLocaleString('fr-FR')}\n`);

const report = {
    buckets: {},
    policies: {},
    rpcFunctions: {},
    tables: {},
    casesColumns: {},
    modulesTables: {},
    errors: []
};

// ========================================
// 1️⃣ VÉRIFICATION DES BUCKETS
// ========================================
async function checkBuckets() {
    console.log('\n📦 [1/6] VÉRIFICATION DES BUCKETS STORAGE\n');
    
    try {
        const { data: buckets, error } = await supabase.storage.listBuckets();
        
        if (error) throw error;
        
        const bucketNames = buckets.map(b => b.name);
        
        report.buckets.attachments = bucketNames.includes('attachments');
        report.buckets.taskScans = bucketNames.includes('task-scans');
        
        console.log(report.buckets.attachments ? '✔️  attachments' : '❌  attachments - MANQUANT');
        console.log(report.buckets.taskScans ? '✔️  task-scans' : '❌  task-scans - MANQUANT');
        
        if (buckets.length > 0) {
            console.log('\n   Détails des buckets:');
            buckets.forEach(bucket => {
                if (bucket.name === 'attachments' || bucket.name === 'task-scans') {
                    console.log(`   - ${bucket.name}:`);
                    console.log(`     • Public: ${bucket.public}`);
                    console.log(`     • Limite taille: ${bucket.file_size_limit || 'Non définie'}`);
                }
            });
        }
    } catch (error) {
        console.error('❌  Erreur lors de la vérification des buckets:', error.message);
        report.errors.push(`Buckets: ${error.message}`);
    }
}

// ========================================
// 2️⃣ VÉRIFICATION DES POLICIES RLS
// ========================================
async function checkPolicies() {
    console.log('\n🔒 [2/6] VÉRIFICATION DES POLICIES RLS\n');
    
    try {
        // Requête pour récupérer les policies
        const { data: policies, error } = await supabase.rpc('execute_sql', {
            query: `
                SELECT 
                    policyname,
                    tablename,
                    cmd,
                    roles::text
                FROM pg_policies 
                WHERE schemaname = 'storage' 
                    AND tablename = 'objects'
                    AND (policyname LIKE '%attachments%' OR policyname LIKE '%task-scans%')
                ORDER BY tablename, cmd;
            `
        });
        
        if (error) {
            // Fallback: vérifier via l'API storage
            console.log('   ℹ️  Impossible d\'accéder directement aux policies');
            console.log('   ℹ️  Les policies sont probablement gérées par Supabase');
            report.policies.status = 'NON_VERIFIABLE';
        } else {
            // Analyser les policies
            const attachmentsPolicies = policies.filter(p => p.policyname.includes('attachments'));
            const taskScansPolicies = policies.filter(p => p.policyname.includes('task-scans'));
            
            console.log(`   Attachments: ${attachmentsPolicies.length} policies trouvées`);
            console.log(`   Task-scans: ${taskScansPolicies.length} policies trouvées`);
            
            report.policies.attachments = attachmentsPolicies.length > 0;
            report.policies.taskScans = taskScansPolicies.length > 0;
        }
    } catch (error) {
        console.log('   ℹ️  Vérification des policies non disponible via l\'API');
        console.log('   ℹ️  Recommandation: Vérifier manuellement dans le Dashboard Supabase');
        report.policies.status = 'NON_VERIFIABLE';
    }
}

// ========================================
// 3️⃣ VÉRIFICATION DES FONCTIONS RPC
// ========================================
async function checkRpcFunctions() {
    console.log('\n⚙️  [3/6] VÉRIFICATION DES FONCTIONS RPC\n');
    
    const functionsToCheck = [
        'create_attachments_bucket',
        'create_task_scans_bucket'
    ];
    
    for (const funcName of functionsToCheck) {
        try {
            // Tenter d'appeler la fonction avec dry-run
            const { data, error } = await supabase.rpc(funcName, {}, {
                head: true
            });
            
            if (error && error.message.includes('Could not find')) {
                console.log(`❌  ${funcName} - MANQUANT`);
                report.rpcFunctions[funcName] = false;
            } else {
                console.log(`✔️  ${funcName}`);
                report.rpcFunctions[funcName] = true;
            }
        } catch (error) {
            console.log(`❌  ${funcName} - MANQUANT`);
            report.rpcFunctions[funcName] = false;
        }
    }
}

// ========================================
// 4️⃣ VÉRIFICATION DES TABLES OBLIGATOIRES
// ========================================
async function checkMandatoryTables() {
    console.log('\n🗂️  [4/6] VÉRIFICATION DES TABLES OBLIGATOIRES\n');
    
    const tablesToCheck = [
        'app_settings',
        'calendar_events',
        'tasks_files'
    ];
    
    for (const tableName of tablesToCheck) {
        try {
            const { data, error } = await supabase
                .from(tableName)
                .select('*', { count: 'exact', head: true });
            
            if (error) {
                console.log(`❌  ${tableName} - MANQUANT`);
                report.tables[tableName] = false;
            } else {
                console.log(`✔️  ${tableName}`);
                report.tables[tableName] = true;
            }
        } catch (error) {
            console.log(`❌  ${tableName} - MANQUANT`);
            report.tables[tableName] = false;
        }
    }
}

// ========================================
// 5️⃣ VÉRIFICATION DES COLONNES CASES
// ========================================
async function checkCasesColumns() {
    console.log('\n📋 [5/6] VÉRIFICATION DES COLONNES DE LA TABLE CASES\n');
    
    const columnsToCheck = [
        'notes',
        'honoraire',
        'expected_end_date',
        'attachments',
        'client_id',
        'created_by',
        'opposing_party',
        'start_date',
        'time_spent',
        'visible_to'
    ];
    
    try {
        // Récupérer une ligne pour vérifier les colonnes
        const { data, error } = await supabase
            .from('cases')
            .select('*')
            .limit(1);
        
        if (error) {
            console.log('❌  Table cases non accessible');
            report.casesColumns.tableExists = false;
            return;
        }
        
        report.casesColumns.tableExists = true;
        const existingColumns = data && data.length > 0 ? Object.keys(data[0]) : [];
        
        for (const colName of columnsToCheck) {
            const exists = existingColumns.includes(colName);
            console.log(exists ? `✔️  cases.${colName}` : `❌  cases.${colName} - MANQUANT`);
            report.casesColumns[colName] = exists;
        }
    } catch (error) {
        console.error('❌  Erreur lors de la vérification des colonnes:', error.message);
        report.errors.push(`Colonnes cases: ${error.message}`);
    }
}

// ========================================
// 6️⃣ VÉRIFICATION DES TABLES MODULES
// ========================================
async function checkModulesTables() {
    console.log('\n🧩 [6/6] VÉRIFICATION DES TABLES DES MODULES\n');
    
    const moduleTables = {
        'tasks': 'Module Tâches',
        'documents': 'Module Documents',
        'profiles': 'Module Collaborateurs',
        'invoices': 'Module Facturation',
        'invoice_items': 'Module Facturation',
        'calendar_events': 'Module Agenda'
    };
    
    for (const [tableName, moduleName] of Object.entries(moduleTables)) {
        try {
            const { data, error } = await supabase
                .from(tableName)
                .select('*', { count: 'exact', head: true });
            
            if (error) {
                console.log(`❌  ${tableName} (${moduleName}) - MANQUANT`);
                report.modulesTables[tableName] = false;
            } else {
                console.log(`✔️  ${tableName} (${moduleName})`);
                report.modulesTables[tableName] = true;
            }
        } catch (error) {
            console.log(`❌  ${tableName} (${moduleName}) - MANQUANT`);
            report.modulesTables[tableName] = false;
        }
    }
}

// ========================================
// GÉNÉRATION DU RAPPORT FINAL
// ========================================
function generateReport() {
    console.log('\n' + '='.repeat(70));
    console.log('                     📊 RAPPORT D\'AUDIT');
    console.log('='.repeat(70) + '\n');
    
    // Statistiques
    const stats = {
        bucketsOK: Object.values(report.buckets).filter(v => v === true).length,
        bucketsTotal: Object.keys(report.buckets).length,
        tablesOK: Object.values(report.tables).filter(v => v === true).length,
        tablesTotal: Object.keys(report.tables).length,
        rpcOK: Object.values(report.rpcFunctions).filter(v => v === true).length,
        rpcTotal: Object.keys(report.rpcFunctions).length,
        casesColsOK: Object.entries(report.casesColumns).filter(([k, v]) => k !== 'tableExists' && v === true).length,
        casesColsTotal: Object.entries(report.casesColumns).filter(([k]) => k !== 'tableExists').length,
        modulesOK: Object.values(report.modulesTables).filter(v => v === true).length,
        modulesTotal: Object.keys(report.modulesTables).length
    };
    
    console.log('📦 Buckets Storage:');
    console.log(`   ${stats.bucketsOK}/${stats.bucketsTotal} présents`);
    console.log(`   Score: ${((stats.bucketsOK/stats.bucketsTotal)*100).toFixed(0)}%\n`);
    
    console.log('⚙️  Fonctions RPC:');
    console.log(`   ${stats.rpcOK}/${stats.rpcTotal} présentes`);
    console.log(`   Score: ${((stats.rpcOK/stats.rpcTotal)*100).toFixed(0)}%\n`);
    
    console.log('🗂️  Tables obligatoires:');
    console.log(`   ${stats.tablesOK}/${stats.tablesTotal} présentes`);
    console.log(`   Score: ${((stats.tablesOK/stats.tablesTotal)*100).toFixed(0)}%\n`);
    
    console.log('📋 Colonnes table cases:');
    console.log(`   ${stats.casesColsOK}/${stats.casesColsTotal} présentes`);
    console.log(`   Score: ${((stats.casesColsOK/stats.casesColsTotal)*100).toFixed(0)}%\n`);
    
    console.log('🧩 Tables des modules:');
    console.log(`   ${stats.modulesOK}/${stats.modulesTotal} présentes`);
    console.log(`   Score: ${((stats.modulesOK/stats.modulesTotal)*100).toFixed(0)}%\n`);
    
    // Score global
    const totalOK = stats.bucketsOK + stats.rpcOK + stats.tablesOK + stats.casesColsOK + stats.modulesOK;
    const totalElements = stats.bucketsTotal + stats.rpcTotal + stats.tablesTotal + stats.casesColsTotal + stats.modulesTotal;
    const globalScore = ((totalOK / totalElements) * 100).toFixed(1);
    
    console.log('=' .repeat(70));
    console.log(`🎯 SCORE GLOBAL: ${globalScore}% (${totalOK}/${totalElements} éléments)`);
    console.log('='.repeat(70) + '\n');
    
    // Actions manquantes
    if (totalOK < totalElements) {
        console.log('⚠️  ACTIONS RECOMMANDÉES:\n');
        
        // Buckets manquants
        if (!report.buckets.attachments) {
            console.log('   • Créer le bucket "attachments"');
        }
        if (!report.buckets.taskScans) {
            console.log('   • Créer le bucket "task-scans"');
        }
        
        // RPC manquants
        if (!report.rpcFunctions.create_attachments_bucket) {
            console.log('   • Créer la fonction RPC "create_attachments_bucket"');
        }
        if (!report.rpcFunctions.create_task_scans_bucket) {
            console.log('   • Créer la fonction RPC "create_task_scans_bucket"');
        }
        
        // Tables manquantes
        Object.entries(report.tables).forEach(([table, exists]) => {
            if (!exists) {
                console.log(`   • Créer la table "${table}"`);
            }
        });
        
        // Colonnes cases manquantes
        Object.entries(report.casesColumns).forEach(([col, exists]) => {
            if (col !== 'tableExists' && !exists) {
                console.log(`   • Ajouter la colonne "cases.${col}"`);
            }
        });
        
        // Tables modules manquantes
        Object.entries(report.modulesTables).forEach(([table, exists]) => {
            if (!exists) {
                console.log(`   • Créer la table "${table}"`);
            }
        });
        
        console.log();
    } else {
        console.log('✅  Tous les éléments sont présents et configurés correctement!\n');
    }
    
    if (report.errors.length > 0) {
        console.log('⚠️  ERREURS RENCONTRÉES:\n');
        report.errors.forEach(error => {
            console.log(`   • ${error}`);
        });
        console.log();
    }
    
    console.log('='.repeat(70));
    console.log(`Audit terminé: ${new Date().toLocaleString('fr-FR')}`);
    console.log('='.repeat(70) + '\n');
}

// ========================================
// EXÉCUTION PRINCIPALE
// ========================================
async function runAudit() {
    try {
        await checkBuckets();
        await checkPolicies();
        await checkRpcFunctions();
        await checkMandatoryTables();
        await checkCasesColumns();
        await checkModulesTables();
        
        generateReport();
    } catch (error) {
        console.error('\n❌  ERREUR CRITIQUE:', error.message);
        console.error(error.stack);
        process.exit(1);
    }
}

// Lancer l'audit
runAudit();
