import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, User, Building, Phone, Mail, MapPin, FileCheck, Calendar, Percent } from 'lucide-react';
import { Button } from '@/components/ui/button';

const ClientForm = ({ client, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    type: 'individual',
    firstName: '',
    lastName: '',
    company: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    postalCode: '',
    country: 'France',
    notes: '',
    // Champs convention
    is_conventionne: false,
    numero_convention: '',
    type_convention: '',
    organisme_convention: '',
    date_debut_convention: '',
    date_fin_convention: '',
    taux_prise_en_charge: '',
    notes_convention: ''
  });

  useEffect(() => {
    if (client) {
      setFormData({
        type: client.type || 'individual',
        firstName: client.firstName || client.first_name || '',
        lastName: client.lastName || client.last_name || '',
        company: client.company || '',
        email: client.email || '',
        phone: client.phone || '',
        address: client.address || '',
        city: client.city || '',
        postalCode: client.postalCode || client.postal_code || '',
        country: client.country || 'France',
        notes: client.notes || '',
        // Champs convention
        is_conventionne: client.is_conventionne || false,
        numero_convention: client.numero_convention || '',
        type_convention: client.type_convention || '',
        organisme_convention: client.organisme_convention || '',
        date_debut_convention: client.date_debut_convention || '',
        date_fin_convention: client.date_fin_convention || '',
        taux_prise_en_charge: client.taux_prise_en_charge || '',
        notes_convention: client.notes_convention || ''
      });
    }
  }, [client]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-slate-800 border border-slate-700 rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white">
            {client ? 'Modifier le Client' : 'Nouveau Client'}
          </h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={onCancel}
            className="text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Type de client
            </label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="type"
                  value="individual"
                  checked={formData.type === 'individual'}
                  onChange={handleChange}
                  className="text-purple-500 focus:ring-purple-500"
                />
                <User className="w-4 h-4 text-slate-400" />
                <span className="text-slate-300">Particulier</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="type"
                  value="company"
                  checked={formData.type === 'company'}
                  onChange={handleChange}
                  className="text-purple-500 focus:ring-purple-500"
                />
                <Building className="w-4 h-4 text-slate-400" />
                <span className="text-slate-300">Entreprise</span>
              </label>
            </div>
          </div>

          {/* Affichage conditionnel selon le type de client */}
          {formData.type === 'company' ? (
            // Pour une entreprise : nom de l'entreprise obligatoire
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                <Building className="w-4 h-4 inline mr-2" />
                Nom de l'entreprise *
              </label>
              <input
                type="text"
                name="company"
                value={formData.company}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="Ex: SARL Martin & Associés"
              />
            </div>
          ) : (
            // Pour un particulier : nom + prénoms obligatoires
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Nom *
                </label>
                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="Dupont"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Prénoms *
                </label>
                <input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="Jean"
                />
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                <Mail className="w-4 h-4 inline mr-2" />
                Email *
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="jean.dupont@email.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                <Phone className="w-4 h-4 inline mr-2" />
                Téléphone *
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="01 23 45 67 89"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              <MapPin className="w-4 h-4 inline mr-2" />
              Adresse
            </label>
            <input
              type="text"
              name="address"
              value={formData.address}
              onChange={handleChange}
              className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="123 Rue de la République"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Ville
              </label>
              <input
                type="text"
                name="city"
                value={formData.city}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="Paris"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Code Postal
              </label>
              <input
                type="text"
                name="postalCode"
                value={formData.postalCode}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="75001"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Pays
              </label>
              <input
                type="text"
                name="country"
                value={formData.country}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="France"
              />
            </div>
          </div>

          {/* Section Convention */}
          <div className="border-t border-slate-700 pt-6">
            <div className="flex items-center gap-2 mb-4">
              <FileCheck className="w-5 h-5 text-green-400" />
              <h3 className="text-lg font-semibold text-white">Client conventionné</h3>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  name="is_conventionne"
                  checked={formData.is_conventionne}
                  onChange={(e) => setFormData(prev => ({ ...prev, is_conventionne: e.target.checked }))}
                  className="w-4 h-4 text-green-500 bg-slate-700 border-slate-600 rounded focus:ring-green-500"
                />
                <label className="text-sm text-slate-300">
                  Ce client bénéficie d'une convention (aide juridictionnelle, assurance, etc.)
                </label>
              </div>

              {formData.is_conventionne && (
                <div className="space-y-4 pl-7 border-l-2 border-green-500/30">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        N° de convention *
                      </label>
                      <input
                        type="text"
                        name="numero_convention"
                        value={formData.numero_convention}
                        onChange={handleChange}
                        required={formData.is_conventionne}
                        className="w-full px-4 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-green-500"
                        placeholder="Ex: CONV-2024-001"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        Type de convention *
                      </label>
                      <select
                        name="type_convention"
                        value={formData.type_convention}
                        onChange={handleChange}
                        required={formData.is_conventionne}
                        className="w-full px-4 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                      >
                        <option value="">Sélectionner...</option>
                        <option value="aide_juridictionnelle">Aide juridictionnelle</option>
                        <option value="assurance_protection_juridique">Assurance protection juridique</option>
                        <option value="convention_entreprise">Convention entreprise</option>
                        <option value="autre">Autre</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Organisme
                    </label>
                    <input
                      type="text"
                      name="organisme_convention"
                      value={formData.organisme_convention}
                      onChange={handleChange}
                      className="w-full px-4 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-green-500"
                      placeholder="Ex: Allianz, CPAM, Ministère de la Justice..."
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        <Calendar className="w-4 h-4 inline mr-1" />
                        Date début
                      </label>
                      <input
                        type="date"
                        name="date_debut_convention"
                        value={formData.date_debut_convention}
                        onChange={handleChange}
                        className="w-full px-4 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        <Calendar className="w-4 h-4 inline mr-1" />
                        Date fin
                      </label>
                      <input
                        type="date"
                        name="date_fin_convention"
                        value={formData.date_fin_convention}
                        onChange={handleChange}
                        className="w-full px-4 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        <Percent className="w-4 h-4 inline mr-1" />
                        Taux prise en charge (%)
                      </label>
                      <input
                        type="number"
                        name="taux_prise_en_charge"
                        value={formData.taux_prise_en_charge}
                        onChange={handleChange}
                        min="0"
                        max="100"
                        step="0.01"
                        className="w-full px-4 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-green-500"
                        placeholder="Ex: 75.50"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Notes spécifiques à la convention
                    </label>
                    <textarea
                      name="notes_convention"
                      value={formData.notes_convention}
                      onChange={handleChange}
                      rows={3}
                      className="w-full px-4 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-green-500"
                      placeholder="Conditions particulières, restrictions, etc..."
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Notes
            </label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows={4}
              className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="Notes additionnelles sur le client..."
            />
          </div>

          <div className="flex gap-4 pt-6">
            <Button
              type="submit"
              className="flex-1 bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700"
            >
              {client ? 'Mettre à jour' : 'Ajouter le client'}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              className="flex-1 border-slate-600 text-slate-300 hover:bg-slate-700"
            >
              Annuler
            </Button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
};

export default ClientForm;