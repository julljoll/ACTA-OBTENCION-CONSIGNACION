/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { Database, Globe, ShieldCheck, ShieldX, FileDown, Printer, Save } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
// @ts-ignore
import html2pdf from 'html2pdf.js';

const DEFAULT_VALUES = {
  nombre: 'JUAN PÉREZ GARCÍA',
  cedula: '20.123.456',
  cedulaPrefix: 'V',
  ciudad: 'CARACAS - DISTRITO CAPITAL',
  telefono: '1234567',
  telefonoCarrier: '0414',
  direccion: 'Av. Francisco de Miranda, Edif. Centro, Apto 4B',
  marca: 'Samsung',
  modelo: 'Galaxy S23 Ultra',
  color: 'Phantom Black',
  serial: 'RF8W1234567X',
  imei1: '351234567890123',
  imei2: '351234567890124',
  numTelefónico: '0412-7654321 / Movistar',
  codigoDesbloqueo: 'PIN: 1234 / Patrón en forma de L',
  estadoFisico: 'Optimo',
  aplicacionObjeto: 'WhatsApp',
  contactoEspecifico: '0424-9876543',
  fechaDesde: '2024-01-01',
  fechaHasta: '2024-12-31',
};

const getInputClass = (name: string, value: any) => {
  if (typeof value === 'boolean') return '';
  const isDefault = value === DEFAULT_VALUES[name as keyof typeof DEFAULT_VALUES];
  return `input-field-clean ${isDefault ? 'text-gray-400 italic' : 'text-black font-bold'}`;
};

const FormField = ({ label, children, className = "" }: { label: string, children: React.ReactNode, className?: string }) => (
  <div className={className}>
    <label className="label-text">{label}</label>
    <div className="input-container">
      {children}
    </div>
  </div>
);

const FormSection = ({ title, icon: Icon, children }: { title: string, icon: any, children: React.ReactNode }) => (
  <section className="section-group">
    <div className="section-label flex items-center space-x-1">
      <Icon className="w-3 h-3" />
      <span>{title}</span>
    </div>
    <div className="px-1">
      {children}
    </div>
  </section>
);

export default function App() {
  const formRef = useRef<HTMLFormElement>(null);
  const [uniqueCode, setUniqueCode] = useState('PENDIENTE_DE_GENERAR');
  const [isPrinting, setIsPrinting] = useState(false);

  const [formData, setFormData] = useState({
    ...DEFAULT_VALUES,
    aislamiento: true,
    calculoHash: true
  });

  useEffect(() => {
    if (isPrinting) {
      const timer = setTimeout(() => {
        window.print();
        setIsPrinting(false);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [isPrinting]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    // @ts-ignore
    const val = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;
    setFormData(prev => ({ ...prev, [name]: val }));
  };

  const onFocusClearDefault = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    if (value === DEFAULT_VALUES[name as keyof typeof DEFAULT_VALUES]) {
      setFormData(prev => ({ ...prev, [name]: '' }));
    }
  };

  const saveForm = async () => {
    try {
      const dataToSave = {
        ...formData,
        cedula: `${formData.cedulaPrefix}-${formData.cedula}`,
        telefono: `${formData.telefonoCarrier}-${formData.telefono}`
      };
      const response = await fetch('/api/forms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dataToSave)
      });
      const result = await response.json();
      if (result.success) {
        setUniqueCode(result.id);
        return result.id;
      }
    } catch (error) {
      console.error('Network error saving form:', error);
    }
    return null;
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = () => {
    const element = document.querySelector('.print-container-window');
    if (!element) return;

    const opt = {
      margin: 0,
      filename: `Acta_Forense_${formData.cedulaPrefix}${formData.cedula}.pdf`,
      image: { type: 'jpeg' as const, quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, backgroundColor: '#c0c0c0' },
      jsPDF: { unit: 'in' as const, format: 'letter' as const, orientation: 'portrait' as const }
    };

    html2pdf().set(opt).from(element as HTMLElement).save();
  };

  const handleSaveAndPrint = async () => {
    // Basic validation
    const requiredFields = ['nombre', 'cedula', 'marca', 'modelo', 'serial'];
    const missingFields = requiredFields.filter(field => {
      const val = formData[field as keyof typeof formData];
      return !val || val === DEFAULT_VALUES[field as keyof typeof DEFAULT_VALUES];
    });
    
    if (missingFields.length > 0) {
      alert("Por favor rellene los campos obligatorios antes de grabar.");
      return;
    }

    const id = await saveForm();
    // Even if fetch fails (404), we can generate a local ID for demo purposes
    if (!id) {
      const fallbackId = `LOC-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
      setUniqueCode(fallbackId);
    }
    
    setIsPrinting(true);
  };


  return (
    <div className="min-h-screen bg-[#008080] p-4 sm:p-8 flex items-center justify-center overflow-auto">
      <div className="print-container-wrapper w-full max-w-[8.5in]">
        <div className="print-container-window">
          {/* Win95 Title Bar */}
          <div className="win95-titlebar mb-4">
            <div className="flex items-center space-x-2">
              <Database className="w-3 h-3 text-white" />
              <span className="text-[11px]">Acta_Forense_v1.5.exe</span>
            </div>
            <div className="flex space-x-1">
              <button className="win95-button-sm">_</button>
              <button className="win95-button-sm">□</button>
              <button className="win95-button-sm text-black">X</button>
            </div>
          </div>

          <div className="p-4 sm:p-8">
            {/* Header / Expediente */}
            <div className="flex flex-col md:flex-row justify-between items-start mb-8 gap-6">
              <div className="space-y-4">
                <div className="win95-sunken p-2 bg-white max-w-xs shadow-[inset_1px_1px_#000000]">
                  <p className="text-[9px] font-bold text-gray-500 uppercase mb-1">Registro de Expediente No.</p>
                  <p className="font-mono text-sm font-bold text-black border-l-4 border-[#000080] pl-2">
                    EXP-{formData.cedulaPrefix}{formData.cedula.replace(/[^0-9]/g, '') || '00000000'}
                  </p>
                </div>
                <div>
                  <h2 className="text-lg font-bold bg-[#000080] text-white px-2 inline-block">ACTA DE OBTENCIÓN POR CONSIGNACIÓN</h2>
                  <p className="text-[9px] text-black font-bold uppercase mt-1">LABORATORIO DE INFORMÁTICA FORENSE Y CIBERSEGURIDAD SHA256.US</p>
                </div>
              </div>

              <div className="win95-raised p-2 text-right w-full md:w-56">
                <h1 className="text-2xl font-black italic tracking-tighter text-[#000080] leading-none">
                  SHA256<span className="text-black">.US</span>
                </h1>
                <div className="h-[2px] bg-[#000080] my-1"></div>
                <p className="text-[9px] text-black font-bold uppercase">Scientific Analysis</p>
              </div>
            </div>

            <form ref={formRef} className="space-y-4">
              {/* Section I */}
              <FormSection title="I. Identificación del Sujeto" icon={ShieldCheck}>
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                  <div className="lg:col-span-12 space-y-4">
                    <FormField label="Nombre y Apellidos COMPLETOS">
                      <input type="text" name="nombre" value={formData.nombre} onChange={handleInputChange} onFocus={onFocusClearDefault} className={getInputClass('nombre', formData.nombre)} />
                    </FormField>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <FormField label="Cédula de Identidad">
                        <div className="flex w-full items-center">
                          <select name="cedulaPrefix" value={formData.cedulaPrefix} onChange={handleInputChange} className="bg-white border-none outline-none w-10 text-center font-bold h-full text-[12px]">
                            <option value="V">V</option>
                            <option value="E">E</option>
                          </select>
                          <div className="w-[1px] h-4 bg-gray-400"></div>
                          <input type="text" name="cedula" value={formData.cedula} onChange={handleInputChange} onFocus={onFocusClearDefault} className={`${getInputClass('cedula', formData.cedula)} flex-1 font-mono`} />
                        </div>
                      </FormField>

                      <FormField label="Número de Contacto">
                        <div className="flex w-full items-center">
                          <select name="telefonoCarrier" value={formData.telefonoCarrier} onChange={handleInputChange} className="bg-white border-none outline-none w-14 text-center font-bold text-[12px]">
                            <option value="0414">0414</option>
                            <option value="0424">0424</option>
                            <option value="0412">0412</option>
                          </select>
                          <div className="w-[1px] h-4 bg-gray-400"></div>
                          <input type="text" name="telefono" value={formData.telefono} onChange={handleInputChange} onFocus={onFocusClearDefault} className={`${getInputClass('telefono', formData.telefono)} flex-1 font-mono`} />
                        </div>
                      </FormField>
                    </div>
                  </div>

                  <div className="lg:col-span-12 win95-raised bg-[#ffffcc] p-3 border-l-4 border-l-[#000080]">
                    <p className="text-[10px] leading-relaxed text-black italic">
                      "Yo, el arriba identificado, en pleno uso de mis facultades mentales <span className="font-bold underline">AUTORIZO EXPRESA Y VOLUNTARIAMENTE</span> su acceso, exploración y extracción forense de datos. Para ello, renuncio temporalmente a mi derecho al secreto de las comunicaciones (Ref. Arts. 48 y 60 de la Constitución de la República Bolivariana de Venezuela)."
                    </p>
                  </div>
                </div>
              </FormSection>

              {/* Section II */}
              <FormSection title="II. Especificaciones del Hardware" icon={Database}>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  <FormField label="Fabricante">
                    <input type="text" name="marca" value={formData.marca} onChange={handleInputChange} onFocus={onFocusClearDefault} className={getInputClass('marca', formData.marca)} />
                  </FormField>
                  <FormField label="Modelo">
                    <input type="text" name="modelo" value={formData.modelo} onChange={handleInputChange} onFocus={onFocusClearDefault} className={getInputClass('modelo', formData.modelo)} />
                  </FormField>
                  <FormField label="Número de Serial">
                    <input type="text" name="serial" value={formData.serial} onChange={handleInputChange} onFocus={onFocusClearDefault} className={getInputClass('serial', formData.serial)} />
                  </FormField>
                  <FormField label="IMEI Primary">
                    <input type="text" name="imei1" value={formData.imei1} onChange={handleInputChange} onFocus={onFocusClearDefault} className={`${getInputClass('imei1', formData.imei1)} font-mono`} />
                  </FormField>
                  <FormField label="Estado Físico">
                    <select name="estadoFisico" value={formData.estadoFisico} onChange={handleInputChange} className="input-field-clean bg-white h-6">
                      <option value="Optimo">Óptimo</option>
                      <option value="Regular">Regular</option>
                      <option value="Dañado">Deteriorado</option>
                    </select>
                  </FormField>
                  <FormField label="PIN de Acceso">
                    <input type="text" name="codigoDesbloqueo" value={formData.codigoDesbloqueo} onChange={handleInputChange} onFocus={onFocusClearDefault} className={`${getInputClass('codigoDesbloqueo', formData.codigoDesbloqueo)} font-mono`} />
                  </FormField>
                </div>
              </FormSection>

              {/* Section III */}
              <FormSection title="III. Parámetros de Extracción" icon={Globe}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField label="Servicio Target">
                    <select name="aplicacionObjeto" value={formData.aplicacionObjeto} onChange={handleInputChange} className="input-field-clean bg-white h-6">
                      <option value="WhatsApp">WhatsApp Messenger</option>
                      <option value="Telegram">Telegram Messenger</option>
                      <option value="Cámara">Galería Multimedia</option>
                      <option value="Copia Total">Copia de Seguridad FULL</option>
                    </select>
                  </FormField>
                  <div className="grid grid-cols-2 gap-2">
                    <FormField label="Fecha Inicio">
                      <input type="date" name="fechaDesde" value={formData.fechaDesde} onChange={handleInputChange} className="input-field-clean bg-white h-6 text-[11px]" />
                    </FormField>
                    <FormField label="Fecha Cierre">
                      <input type="date" name="fechaHasta" value={formData.fechaHasta} onChange={handleInputChange} className="input-field-clean bg-white h-6 text-[11px]" />
                    </FormField>
                  </div>
                </div>
                <p className="text-[9px] text-gray-600 mt-2 italic px-1">
                  * Advertencia: La extracción se ejecutará estrictamente sobre los metadatos y registros generados en el intervalo seleccionado.
                </p>
              </FormSection>

              {/* Signatures */}
              <div className="grid grid-cols-2 gap-8 pt-6 pb-2">
                <div className="text-center space-y-2">
                  <div className="signature-box bg-white">
                    <span className="text-[10px] text-gray-300 font-bold uppercase select-none">FIRMA ELECTRÓNICA</span>
                  </div>
                  <p className="text-[11px] font-bold text-black border-t border-black pt-1">{formData.nombre || 'Nombre del Sujeto'}</p>
                </div>
                <div className="text-center space-y-2">
                  <div className="signature-box bg-white font-mono text-[9px] p-2 leading-tight flex flex-col justify-end">
                    <span className="text-gray-100 flex-1 flex items-center justify-center text-4xl">SHA</span>
                    <span className="text-black uppercase">Sello Digital de Integridad</span>
                  </div>
                  <p className="text-[11px] font-bold text-black border-t border-black pt-1">ESPECIALISTA FORENSE</p>
                </div>
              </div>

              <div className="mt-4 p-2 win95-sunken bg-gray-50 italic text-[9px] text-gray-500 leading-tight">
                Certificación: Este documento tiene validez legal al ser consignado ante el Ministerio Público o Tribunales competentes, 
                garantizando la integridad de la evidencia digital bajo los protocolos internacionales de cadena de custodia.
              </div>
            </form>

            {/* Win95 Footer Taskbar */}
            <div className="mt-8 border-t-2 border-white pt-4 flex flex-wrap justify-end gap-2 no-print">
              <button onClick={handleSaveAndPrint} className="win95-button">
                <Save className="w-3.5 h-3.5 mr-2" />
                <span>Grabar</span>
              </button>
              <button onClick={handleDownloadPDF} className="win95-button">
                <FileDown className="w-3.5 h-3.5 mr-2" />
                <span>Exportar</span>
              </button>
              <button onClick={handlePrint} className="win95-button bg-[#ffffcc] font-bold">
                <Printer className="w-3.5 h-3.5 mr-2" />
                <span>Imprimir</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
