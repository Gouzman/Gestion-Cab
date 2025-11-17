/**
 * ============================================
 * Composant : CompanyInfoSettings
 * ============================================
 * Gestion des informations générales de l'entreprise
 * (nom, logo, adresse, téléphone, email, slogan, description)
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Building2, Save, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import { useCompanyInfo, updateCompanyInfo } from '@/lib/appSettings';

const CompanyInfoSettings = () => {
  const { companyInfo, loading } = useCompanyInfo();
  const [formData, setFormData] = useState({
    name: '',
    logo_url: '',
    address: '',
    phone: '',
    email: '',
    slogan: '',
    description: ''
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (companyInfo) {
      setFormData(companyInfo);
    }
  }, [companyInfo]);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    const result = await updateCompanyInfo(formData);
    
    if (result.success) {
      toast({ 
        title: "✅ Informations sauvegardées", 
        description: "Les informations de l'entreprise ont été mises à jour." 
      });
    } else {
      toast({ 
        variant: "destructive",
        title: "❌ Erreur", 
        description: "Impossible de sauvegarder les informations." 
      });
    }
    setSaving(false);
  };

  if (loading) {
    return <div className="text-slate-400 text-center py-8">Chargement...</div>;
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }} 
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="flex items-center gap-3 mb-6">
        <Building2 className="w-6 h-6 text-purple-400" />
        <h2 className="text-xl font-semibold text-white">Informations de l'entreprise</h2>
      </div>

      {/* Nom de l'entreprise */}
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2">
          Nom de l'entreprise
        </label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => handleChange('name', e.target.value)}
          placeholder="Cabinet d'Avocats..."
          className="w-full px-4 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
        />
      </div>

      {/* Logo URL */}
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2">
          Logo (URL)
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={formData.logo_url}
            onChange={(e) => handleChange('logo_url', e.target.value)}
            placeholder="https://exemple.com/logo.png"
            className="flex-grow px-4 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
          <Button variant="outline" size="icon" className="border-slate-600">
            <Upload className="w-4 h-4" />
          </Button>
        </div>
        {formData.logo_url && (
          <img 
            src={formData.logo_url} 
            alt="Logo" 
            className="mt-3 h-16 object-contain bg-white/10 p-2 rounded-lg"
            onError={(e) => e.target.style.display = 'none'}
          />
        )}
      </div>

      {/* Adresse */}
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2">
          Adresse
        </label>
        <textarea
          value={formData.address}
          onChange={(e) => handleChange('address', e.target.value)}
          placeholder="123 Rue de la Justice, 75001 Paris"
          rows={3}
          className="w-full px-4 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
        />
      </div>

      {/* Téléphone et Email */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Téléphone
          </label>
          <input
            type="tel"
            value={formData.phone}
            onChange={(e) => handleChange('phone', e.target.value)}
            placeholder="+33 1 23 45 67 89"
            className="w-full px-4 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Email
          </label>
          <input
            type="email"
            value={formData.email}
            onChange={(e) => handleChange('email', e.target.value)}
            placeholder="contact@cabinet.fr"
            className="w-full px-4 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>
      </div>

      {/* Slogan */}
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2">
          Slogan
        </label>
        <input
          type="text"
          value={formData.slogan}
          onChange={(e) => handleChange('slogan', e.target.value)}
          placeholder="Votre partenaire juridique de confiance"
          className="w-full px-4 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
        />
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2">
          Description
        </label>
        <textarea
          value={formData.description}
          onChange={(e) => handleChange('description', e.target.value)}
          placeholder="Description détaillée de votre cabinet..."
          rows={4}
          className="w-full px-4 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
        />
      </div>

      {/* Bouton de sauvegarde */}
      <div className="flex justify-end pt-4">
        <Button 
          onClick={handleSave}
          disabled={saving}
          size="lg"
          className="bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700"
        >
          <Save className="w-5 h-5 mr-2" />
          {saving ? 'Sauvegarde...' : 'Sauvegarder'}
        </Button>
      </div>
    </motion.div>
  );
};

export default CompanyInfoSettings;
