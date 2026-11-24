import React, { useState } from 'react';
import { X, Building2, MapPin, User, Ruler, DollarSign, Check } from 'lucide-react';
import type { Farm } from '../../types/animal';
import { db } from '../../db';
import { generateId } from '../../utils/id';

interface CreateFarmModalProps {
  onClose: () => void;
  onCreated: (newFarm: Farm) => void;
}

export const CreateFarmModal: React.FC<CreateFarmModalProps> = ({
  onClose,
  onCreated
}) => {
  const [name, setName] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [location, setLocation] = useState('');
  const [country, setCountry] = useState('Colombia');
  const [areaHectares, setAreaHectares] = useState('150');
  const [currency, setCurrency] = useState('USD');
  const [purpose, setPurpose] = useState<Farm['purpose']>('dual_purpose');
  const [cattleBreedDefault, setCattleBreedDefault] = useState('Girolando / Brahman');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('El nombre de la hacienda o finca es obligatorio.');
      return;
    }

    const farm: Farm = {
      id: generateId('farm'),
      name: name.trim(),
      ownerName: ownerName.trim() || 'Propietario',
      location: location.trim() || undefined,
      country,
      currency,
      areaHectares: parseFloat(areaHectares) || 0,
      purpose,
      cattleBreedDefault,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    await db.farms.add(farm);
    onCreated(farm);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6 space-y-4">
        <div className="flex items-center justify-between border-b pb-3">
          <h3 className="text-lg font-bold text-gray-900 flex items-center space-x-2">
            <Building2 className="w-5 h-5 text-ranch-600" />
            <span>Registrar Nueva Hacienda / Finca</span>
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs font-semibold text-rose-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-gray-700 mb-1">Nombre de la Finca / Hacienda *</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Ej: Rancho Los Sauces, Hacienda Bella Vista..."
              className="w-full px-3 py-2 border border-gray-300 rounded-xl text-xs focus:ring-2 focus:ring-ranch-500"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-gray-700 mb-1">Propietario / Titular</label>
              <div className="relative">
                <User className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-2.5" />
                <input
                  type="text"
                  value={ownerName}
                  onChange={e => setOwnerName(e.target.value)}
                  placeholder="Nombre y apellido"
                  className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-xl text-xs"
                />
              </div>
            </div>
            <div>
              <label className="block font-semibold text-gray-700 mb-1">Ubicación / Municipio</label>
              <div className="relative">
                <MapPin className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-2.5" />
                <input
                  type="text"
                  value={location}
                  onChange={e => setLocation(e.target.value)}
                  placeholder="Ej: Meta, Villavicencio..."
                  className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-xl text-xs"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block font-semibold text-gray-700 mb-1">Área (Hectáreas)</label>
              <div className="relative">
                <Ruler className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-2.5" />
                <input
                  type="number"
                  step="0.5"
                  value={areaHectares}
                  onChange={e => setAreaHectares(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-xl text-xs"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-gray-700 mb-1">Propósito Ganadero</label>
              <select
                value={purpose}
                onChange={e => setPurpose(e.target.value as any)}
                className="w-full px-3 py-2 border border-gray-300 rounded-xl text-xs bg-white"
              >
                <option value="milk">Lechería Especializada</option>
                <option value="beef">Ceba / Cría de Carne</option>
                <option value="dual_purpose">Doble Propósito</option>
                <option value="mixed">Mixto / Genética</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-gray-700 mb-1">Moneda Contable</label>
              <div className="relative">
                <DollarSign className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-2.5" />
                <select
                  value={currency}
                  onChange={e => setCurrency(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-xl text-xs bg-white"
                >
                  <option value="USD">USD ($)</option>
                  <option value="COP">COP ($)</option>
                  <option value="MXN">MXN ($)</option>
                  <option value="BRL">BRL (R$)</option>
                  <option value="ARS">ARS ($)</option>
                </select>
              </div>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-gray-700 mb-1">Raza Principal o Predominante</label>
            <input
              type="text"
              value={cattleBreedDefault}
              onChange={e => setCattleBreedDefault(e.target.value)}
              placeholder="Ej: Girolando, Brahman Blanco, Angus..."
              className="w-full px-3 py-2 border border-gray-300 rounded-xl text-xs"
            />
          </div>

          <div className="flex justify-end space-x-2 pt-3 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="inline-flex items-center px-4 py-2 bg-ranch-600 text-white rounded-xl font-semibold hover:bg-ranch-700 shadow-xs"
            >
              <Check className="w-4 h-4 mr-1.5" />
              Guardar Hacienda
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
