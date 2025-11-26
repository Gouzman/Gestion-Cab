/**
 * ============================================
 * Composant : CompanyInfoSettings
 * ============================================
 * Gestion des informations générales de l'entreprise
 * (nom, logo, adresse, téléphone, email, slogan, description)
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Building2, Save, Upload, X, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import { useCompanyInfo, updateCompanyInfo } from '@/lib/appSettings';
import { supabase } from '@/lib/customSupabaseClient';

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
  const [uploading, setUploading] = useState(false);
  const [logoPreview, setLogoPreview] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (companyInfo) {
      setFormData(companyInfo);
      setLogoPreview(companyInfo.logo_url || null);
    }
  }, [companyInfo]);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleLogoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validation du fichier
    const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml'];
    if (!validTypes.includes(file.type)) {
      toast({
        variant: "destructive",
        title: "❌ Format invalide",
        description: "Seuls les formats PNG, JPG, JPEG et SVG sont acceptés."
      });
      return;
    }

    if (file.size > 2 * 1024 * 1024) { // 2MB max
      toast({
        variant: "destructive",
        title: "❌ Fichier trop volumineux",
        description: "La taille maximale est de 2 Mo."
      });
      return;
    }

    setUploading(true);

    try {
      // Upload vers Supabase Storage
      const fileExt = file.name.split('.').pop();
      const fileName = `logo-${Date.now()}.${fileExt}`;
      const filePath = `company-logos/${fileName}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('attachments')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) throw uploadError;

      // Obtenir l'URL publique
      const { data: urlData } = supabase.storage
        .from('attachments')
        .getPublicUrl(filePath);

      const logoUrl = urlData.publicUrl;
      setFormData(prev => ({ ...prev, logo_url: logoUrl }));
      setLogoPreview(logoUrl);

      toast({
        title: "✅ Logo téléchargé",
        description: "Le logo a été uploadé avec succès. N'oubliez pas de sauvegarder."
      });
    } catch (error) {
      console.error('Erreur upload logo:', error);
      toast({
        variant: "destructive",
        title: "❌ Erreur d'upload",
        description: "Impossible de télécharger le logo."
      });
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveLogo = () => {
    setFormData(prev => ({ ...prev, logo_url: '' }));
    setLogoPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
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

      {/* Logo */}
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2">
          Logo de l'entreprise
        </label>
        <p className="text-xs text-slate-400 mb-3">
          Le logo apparaîtra sur l'écran de connexion, dans la barre latérale et sur les documents exportés
        </p>
        
        {/* Aperçu du logo */}
        {logoPreview && (
          <div className="mb-4 relative inline-block">
            <div className="bg-white/10 p-4 rounded-lg border border-slate-600">
              <img 
                src={logoPreview} 
                alt="Logo de l'entreprise" 
                className="h-24 max-w-[200px] object-contain"
                onError={(e) => {
                  e.target.src = '';
                  e.target.alt = 'Erreur de chargement';
                }}
              />
            </div>
            <Button
              onClick={handleRemoveLogo}
              variant="ghost"
              size="icon"
              className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-red-500 hover:bg-red-600 text-white"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        )}

        {/* Zone d'upload */}
        <div className="flex gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/jpg,image/svg+xml"
            onChange={handleLogoUpload}
            className="hidden"
          />
          <Button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            variant="outline"
            className="border-slate-600 text-slate-300 hover:bg-slate-700"
          >
            <Upload className="w-4 h-4 mr-2" />
            {uploading ? 'Upload en cours...' : 'Télécharger un fichier'}
          </Button>
          <span className="flex items-center text-xs text-slate-500">
            <ImageIcon className="w-3 h-3 mr-1" />
            PNG, JPG, SVG (max 2 Mo)
          </span>
        </div>

        {/* URL manuelle optionnelle */}
        <div className="mt-3">
          <label className="block text-xs font-medium text-slate-400 mb-1">
            Ou entrez une URL
          </label>
          <input
            type="text"
            value={formData.logo_url}
            onChange={(e) => {
              handleChange('logo_url', e.target.value);
              setLogoPreview(e.target.value || null);
            }}
            placeholder="https://exemple.com/logo.png"
            className="w-full px-3 py-2 text-sm bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>
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
