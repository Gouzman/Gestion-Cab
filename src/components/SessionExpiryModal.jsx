/**
 * ============================================
 * Composant : SessionExpiryModal
 * ============================================
 * Modal d'avertissement avant déconnexion automatique
 */

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Clock, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';

const SessionExpiryModal = ({ isOpen, remainingSeconds, onExtend, onLogout }) => {
  if (!isOpen) return null;

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={onExtend}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative bg-slate-800 border border-slate-700 rounded-xl p-8 w-full max-w-md shadow-2xl"
          >
            {/* Icône d'alerte */}
            <div className="flex justify-center mb-6">
              <div className="p-4 bg-yellow-500/20 rounded-full border-2 border-yellow-500/50">
                <AlertTriangle className="w-12 h-12 text-yellow-400" />
              </div>
            </div>

            {/* Titre */}
            <h2 className="text-2xl font-bold text-white text-center mb-3">
              Session expirée bientôt
            </h2>

            {/* Description */}
            <p className="text-slate-400 text-center mb-6">
              Votre session sera automatiquement fermée dans :
            </p>

            {/* Compte à rebours */}
            <div className="flex items-center justify-center gap-3 mb-8">
              <Clock className="w-6 h-6 text-blue-400" />
              <div className={`text-4xl font-bold ${
                remainingSeconds <= 10 ? 'text-red-400 animate-pulse' : 'text-white'
              }`}>
                {formatTime(remainingSeconds)}
              </div>
            </div>

            {/* Message */}
            <p className="text-sm text-slate-500 text-center mb-6">
              Vous avez été inactif pendant un certain temps. Pour des raisons de sécurité, 
              votre session sera fermée automatiquement.
            </p>

            {/* Actions */}
            <div className="flex gap-3">
              <Button
                onClick={onExtend}
                className="flex-1 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 h-12"
              >
                <Clock className="w-4 h-4 mr-2" />
                Rester connecté
              </Button>
              <Button
                onClick={onLogout}
                variant="outline"
                className="flex-1 border-slate-600 text-slate-300 hover:bg-slate-700 h-12"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Se déconnecter
              </Button>
            </div>

            {/* Note de sécurité */}
            <p className="text-xs text-slate-600 text-center mt-4">
              🔒 Cette mesure protège vos données en cas d'oubli de déconnexion
            </p>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default SessionExpiryModal;
