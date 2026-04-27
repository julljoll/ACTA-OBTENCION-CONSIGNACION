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
    <div className="min-h-screen bg-[#008080] p-4 sm:p-8 flex items-center justify-center overflow-auto print:bg-white print:p-0">
      <div className="print-container-wrapper w-full max-w-[8.5in] relative print:max-w-none print:w-full">
        <div className="print-container-window print:border-none print:shadow-none">
          {/* Win95 Title Bar */}
          <div className="win95-titlebar mb-4 print:hidden">
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

          <div className="p-3 sm:p-6 print:p-0">
            {/* Header / Expediente */}
            <div className="flex flex-col md:flex-row justify-between items-start mb-4 gap-4 print:flex-row print:justify-between print:items-start">
              <div className="space-y-2">
                <div className="win95-sunken p-2 bg-white max-w-xs shadow-[inset_1px_1px_#000000] print:border-l-4 print:border-black print:pl-4 print:mb-2 print:border-none print:shadow-none">
                  <p className="text-[9px] font-bold text-gray-500 uppercase mb-1">Registro de Expediente No.</p>
                  <p className="font-mono text-sm font-bold text-black border-l-4 border-[#000080] pl-2 print:border-black print:text-lg">
                    EXP-{formData.cedulaPrefix}{formData.cedula.replace(/[^0-9]/g, '') || '00000000'}
                  </p>
                </div>
                <div>
                  <h2 className="text-lg font-bold bg-[#000080] text-white px-2 inline-block print:bg-transparent print:text-black print:p-0 print:text-xl">ACTA DE OBTENCIÓN POR CONSIGNACIÓN</h2>
                  <p className="text-[9px] text-black font-bold mt-1 print:text-[10px] uppercase print:normal-case">Laboratorio de Informática Forense y Ciberseguridad SHA256.US</p>
                  <p className="text-[8px] text-gray-700 mt-0.5 max-w-sm leading-tight print:text-[8px]">Avenida 6, con calle 7, Edificio Mercantil La Ceiba, primer piso, oficina Nº 8, Quibor, Municipio Jiménez del Estado Lara.</p>
                </div>
              </div>

              <div className="win95-raised p-2 text-right w-full md:w-56 print:border-none print:w-auto print:text-right">
                <h1 className="text-2xl font-black italic tracking-tighter text-[#000080] leading-none print:text-black">
                  SHA256<span className="text-black">.US</span>
                </h1>
                <p className="text-[9px] text-gray-500 font-mono lowercase tracking-widest mt-1 print:text-[8px]">forensic laboratory</p>
              </div>
            </div>

            <form ref={formRef} className="space-y-3 print:space-y-1">
              {/* Section I */}
              <FormSection title="I. DATOS DEL SOLICITANTE Y AUTORIZACIÓN" icon={ShieldCheck}>
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
                  <div className="lg:col-span-12 space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <FormField label="NOMBRE COMPLETO">
                        <input type="text" name="nombre" value={formData.nombre} onChange={handleInputChange} onFocus={onFocusClearDefault} className={getInputClass('nombre', formData.nombre)} />
                      </FormField>

                      <FormField label="CÉDULA / IDENTIFICACIÓN">
                        <div className="flex w-full items-center">
                          <select name="cedulaPrefix" value={formData.cedulaPrefix} onChange={handleInputChange} className="bg-white border-none outline-none w-10 text-center font-bold h-full text-[12px] print:appearance-none print:w-auto print:pr-1">
                            <option value="V">V</option>
                            <option value="E">E</option>
                          </select>
                          <div className="w-[1px] h-4 bg-gray-400"></div>
                          <input type="text" name="cedula" value={formData.cedula} onChange={handleInputChange} onFocus={onFocusClearDefault} className={`${getInputClass('cedula', formData.cedula)} flex-1 font-mono pl-1`} />
                        </div>
                      </FormField>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <FormField label="CIUDAD">
                        <input type="text" name="ciudad" value={formData.ciudad} onChange={handleInputChange} onFocus={onFocusClearDefault} className={getInputClass('ciudad', formData.ciudad)} />
                      </FormField>

                      <FormField label="TELÉFONO">
                        <div className="flex w-full items-center">
                          <select name="telefonoCarrier" value={formData.telefonoCarrier} onChange={handleInputChange} className="bg-white border-none outline-none w-14 text-center font-bold text-[12px] print:appearance-none print:w-auto print:pr-1">
                            <option value="0414">0414</option>
                            <option value="0424">0424</option>
                            <option value="0412">0412</option>
                            <option value="0416">0416</option>
                            <option value="0426">0426</option>
                          </select>
                          <div className="w-[1px] h-4 bg-gray-400"></div>
                          <input type="text" name="telefono" value={formData.telefono} onChange={handleInputChange} onFocus={onFocusClearDefault} className={`${getInputClass('telefono', formData.telefono)} flex-1 font-mono pl-1`} />
                        </div>
                      </FormField>
                    </div>
                    
                    <FormField label="DIRECCIÓN COMPLETA">
                      <input type="text" name="direccion" value={formData.direccion} onChange={handleInputChange} onFocus={onFocusClearDefault} className={getInputClass('direccion', formData.direccion)} />
                    </FormField>
                  </div>

                  <div className="lg:col-span-12 win95-raised bg-[#ffffcc] p-3 border-l-4 border-l-[#000080] print:bg-white print:border-l-black print:border print:p-2">
                    <p className="text-[10px] leading-relaxed text-black italic">
                      "Yo, el arriba identificado, en pleno uso de mis facultades mentales <span className="font-bold text-[#008080] print:text-black">AUTORIZO EXPRESA Y VOLUNTARIAMENTE</span> su acceso, exploración y extracción forense de datos. Para ello, renuncio temporalmente a mi derecho al secreto de las comunicaciones <span className="text-[#008080] print:text-black">(Ref. Arts. 48 y 60 de la Constitución de la República Bolivariana de Venezuela)</span>, única y exclusivamente a favor de los expertos designados y para los fines técnicos aquí descritos."
                    </p>
                  </div>
                </div>
              </FormSection>

              {/* Section II */}
              <FormSection title="II. DESCRIPCIÓN DEL DISPOSITIVO (DISPOSITIVO MATRIZ)" icon={Database}>
                <p className="text-[10px] font-bold mb-2">
                  • Hago entrega material voluntaria del siguiente equipo bajo la figura de Obtención por Consignación.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <FormField label="MARCA">
                    <input type="text" name="marca" value={formData.marca} onChange={handleInputChange} onFocus={onFocusClearDefault} className={getInputClass('marca', formData.marca)} />
                  </FormField>
                  <FormField label="MODELO">
                    <input type="text" name="modelo" value={formData.modelo} onChange={handleInputChange} onFocus={onFocusClearDefault} className={getInputClass('modelo', formData.modelo)} />
                  </FormField>
                  <FormField label="COLOR">
                    <input type="text" name="color" value={formData.color} onChange={handleInputChange} onFocus={onFocusClearDefault} className={getInputClass('color', formData.color)} />
                  </FormField>

                  <FormField label="SERIAL DE FÁBRICA">
                    <input type="text" name="serial" value={formData.serial} onChange={handleInputChange} onFocus={onFocusClearDefault} className={getInputClass('serial', formData.serial)} />
                  </FormField>
                  <FormField label="IMEI 1">
                    <input type="text" name="imei1" value={formData.imei1} onChange={handleInputChange} onFocus={onFocusClearDefault} className={`${getInputClass('imei1', formData.imei1)} font-mono`} />
                  </FormField>
                  <FormField label="IMEI 2">
                    <input type="text" name="imei2" value={formData.imei2} onChange={handleInputChange} onFocus={onFocusClearDefault} className={`${getInputClass('imei2', formData.imei2)} font-mono`} />
                  </FormField>

                  <FormField label="Nº TELEFÓNICO / OPERADORA">
                    <input type="text" name="numTelefónico" value={formData.numTelefónico} onChange={handleInputChange} onFocus={onFocusClearDefault} className={`${getInputClass('numTelefónico', formData.numTelefónico)} font-mono`} />
                  </FormField>
                  <FormField label="CÓDIGO DE DESBLOQUEO (PIN/PATRÓN)">
                    <input type="text" name="codigoDesbloqueo" value={formData.codigoDesbloqueo} onChange={handleInputChange} onFocus={onFocusClearDefault} placeholder="Ej: 1234 o descripción" className={`${getInputClass('codigoDesbloqueo', formData.codigoDesbloqueo)} font-mono`} />
                  </FormField>
                  <FormField label="ESTADO FÍSICO">
                    <select name="estadoFisico" value={formData.estadoFisico} onChange={handleInputChange} className="input-field-clean bg-white h-6">
                      <option value="Optimo">Optimo</option>
                      <option value="Regular">Regular</option>
                      <option value="Dañado">Deteriorado</option>
                    </select>
                  </FormField>
                </div>
              </FormSection>

              {/* Section III */}
              <FormSection title="III. ALCANCE DE LA EXTRACCIÓN Y ANÁLISIS" icon={Globe}>
                <p className="text-[10px] font-bold mb-2">
                  • Solicito la aplicación de herramientas forenses para la extracción lógica/física de "Mensajes de Datos", delimitado estrictamente a:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <FormField label="APLICACIÓN OBJETO">
                    <input type="text" name="aplicacionObjeto" value={formData.aplicacionObjeto} onChange={handleInputChange} onFocus={onFocusClearDefault} className={getInputClass('aplicacionObjeto', formData.aplicacionObjeto)} />
                  </FormField>
                  <FormField label="NÚMERO DE CONTACTO ESPECÍFICO">
                    <input type="text" name="contactoEspecifico" value={formData.contactoEspecifico} onChange={handleInputChange} onFocus={onFocusClearDefault} className={getInputClass('contactoEspecifico', formData.contactoEspecifico)} />
                  </FormField>
                  <div className="grid grid-cols-[auto_1fr_auto_1fr] items-center gap-1">
                    <span className="text-[9px] font-bold uppercase text-gray-500 whitespace-nowrap col-span-4 mb-1">RANGO DE FECHAS (DESDE - HASTA)</span>
                    <input type="date" name="fechaDesde" value={formData.fechaDesde} onChange={handleInputChange} className="input-field-clean bg-white h-6 text-[10px] w-full border border-gray-300 p-1 print:border-b print:border-black print:border-x-0 print:border-t-0 print:rounded-none print:px-0" />
                    <span className="text-[10px] font-bold px-1">al</span>
                    <input type="date" name="fechaHasta" value={formData.fechaHasta} onChange={handleInputChange} className="input-field-clean bg-white h-6 text-[10px] w-full border border-gray-300 p-1 print:border-b print:border-black print:border-x-0 print:border-t-0 print:rounded-none print:px-0" />
                  </div>
                </div>
              </FormSection>

              {/* Section IV */}
              <FormSection title="IV. REQUERIMIENTOS TÉCNICOS Y DE PRESERVACIÓN" icon={ShieldCheck}>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex items-start space-x-2 win95-sunken bg-white p-2 print:border-none print:shadow-none">
                    <input type="checkbox" name="aislamiento" checked={formData.aislamiento} onChange={handleInputChange} className="mt-1" />
                    <div>
                      <p className="text-[10px] font-bold text-black leading-none mb-1">Aislamiento de Señal (Modo Avión/Bolsa Faraday)</p>
                      <p className="text-[9px] text-gray-500 leading-tight">Asegura que el dispositivo no reciba datos remotos durante el análisis.</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-2 win95-sunken bg-white p-2 print:border-none print:shadow-none">
                    <input type="checkbox" name="calculoHash" checked={formData.calculoHash} onChange={handleInputChange} className="mt-1" />
                    <div>
                      <p className="text-[10px] font-bold text-black leading-none mb-1">Cálculo de Algoritmos de Integridad (HASH)</p>
                      <p className="text-[9px] text-gray-500 leading-tight">Generación de huella digital SHA-256 o MD5 para cadena de custodia.</p>
                    </div>
                  </div>
                </div>
              </FormSection>

              {/* Signatures */}
              <div className="grid grid-cols-2 gap-8 pt-4 pb-1">
                <div className="text-center space-y-2">
                  <div className="signature-box bg-white border-dashed border-2 flex items-start p-2">
                    <span className="text-[9px] text-gray-500 font-bold uppercase select-none w-full text-left">FIRMA Y HUELLA (DACTILAR)</span>
                  </div>
                  <div>
                    <p className="text-[11px] font-bold text-black uppercase">EL SOLICITANTE</p>
                    <p className="text-[9px] text-gray-500 uppercase">{formData.nombre || 'JUAN PÉREZ GARCÍA'}</p>
                  </div>
                </div>
                <div className="text-center space-y-2">
                  <div className="signature-box bg-white border-dashed border-2 flex items-start p-2">
                    <span className="text-[9px] text-gray-500 font-bold uppercase select-none w-full text-left">SELLO Y FIRMA INSTITUCIONAL</span>
                  </div>
                  <div>
                    <p className="text-[11px] font-bold text-black uppercase">EXPERTOS FORENSES</p>
                    <p className="text-[9px] text-gray-500">Área de Análisis de Telefonía Móvil</p>
                  </div>
                </div>
              </div>

              <div className="mt-4 text-[9px] text-gray-400">
                Nota: Este documento tiene validez legal al ser consignado ante el Ministerio Público o Tribunales competentes.
              </div>
            </form>

            {/* Win95 Footer Taskbar */}
            <div className="mt-8 border-t-2 border-white pt-4 flex flex-wrap justify-end gap-2 no-print">
              <button onClick={handlePrint} className="win95-button bg-[#ffffcc] font-bold">
                <Printer className="w-3.5 h-3.5 mr-2" />
                <span>Imprimir Documento</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
