import React from 'react';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
} from '@/components/ui/alert-dialog';

/**
 * Modal de confirmation réutilisable pour les suppressions
 * @param {boolean} open - État d'ouverture de la modal
 * @param {function} onOpenChange - Callback pour changer l'état d'ouverture
 * @param {string} title - Titre de la modal (défaut: "Confirmation")
 * @param {string} message - Message de confirmation
 * @param {function} onConfirm - Callback exécuté lors de la confirmation
 * @param {string} confirmLabel - Label du bouton de confirmation (défaut: "Supprimer")
 * @param {string} cancelLabel - Label du bouton d'annulation (défaut: "Annuler")
 */
const ConfirmationModal = ({
  open,
  onOpenChange,
  title = "Confirmation",
  message,
  onConfirm,
  confirmLabel = "Supprimer",
  cancelLabel = "Annuler"
}) => {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="border-slate-700 bg-slate-800">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-white">{title}</AlertDialogTitle>
          <AlertDialogDescription className="text-slate-300">
            {message}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="bg-slate-700 text-white hover:bg-slate-600 border-slate-600">
            {cancelLabel}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className="bg-[#6D071A] text-white hover:bg-[#8B0922] border-0"
          >
            {confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default ConfirmationModal;
