import React, { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid, LineChart, Line } from 'recharts';
import { DollarSign, TrendingUp, TrendingDown, AlertCircle, Edit2, Save, X, Users, Download, Calendar, CompareArrows } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const PresupuestoPersonal = () => {
  const [ingresos, setIngresos] = useState([]);
  const [gastos, setGastos] = useState([]);
  const [editando, setEditando] = useState(null);
  const [valorTemp, setValorTemp] = useState('');
  const [nuevoIngreso, setNuevoIngreso] = useState({ concepto: '', monto: '', persona: 'P1' });
  const [nuevoGasto, setNuevoGasto] = useState({ concepto: '', monto: '', categoria: 'Vivienda', responsable: 'P1' });
  const [anio, setAnio] = useState(new Date().getFullYear());
  const [mes, setMes] = useState(new Date().getMonth() + 1);
  const [comparar, setComparar] = useState(false);
  const [anio2, setAnio2] = useState(new Date().getFullYear());
  const [mes2, setMes2] = useState(new Date().getMonth());

  useEffect(() => {
    cargarDatos();
  }, [anio, mes]);

  const cargarDatos = async () => {
    try {
      const response = await fetch(`http://localhost:3001/api/analisismensual?mes=${mes}&anio=${anio}`);
      const data = await response.json();
      setIngresos(data.ingresos);
      setGastos(data.gastos);
    } catch (error) {
      console.error('Error al cargar datos:', error);
    }
  };

  const totalIngresos = ingresos.reduce((sum, i) => sum + i.monto, 0);
  const totalGastos = gastos.reduce((sum, g) => sum + g.monto, 0);
  const balance = totalIngresos - totalGastos;

  // Ingresos por persona
  const ingresosP1 = ingresos.filter(i => i.persona === 'P1').reduce((sum, i) => sum + i.monto, 0);
  const ingresosP2 = ingresos.filter(i => i.persona === 'P2').reduce((sum, i) => sum + i.monto, 0);
  const ingresosExtra = ingresos.filter(i => i.persona === 'Extra').reduce((sum, i) => sum + i.monto, 0);

  // Gastos por persona
  const gastosP1 = gastos.filter(g => g.responsable === 'P1').reduce((sum, g) => sum + g.monto, 0);
  const gastosP2 = gastos.filter(g => g.responsable === 'P2').reduce((sum, g) => sum + g.monto, 0);

  // Agrupar gastos por categoría
  const gastosPorCategoria = gastos.reduce((acc, gasto) => {
    if (!acc[gasto.categoria]) {
      acc[gasto.categoria] = 0;
    }
    acc[gasto.categoria] += gasto.monto;
    return acc;
  }, {});

  const dataCategoria = Object.entries(gastosPorCategoria).map(([nombre, valor]) => ({
    nombre,
    valor,
    porcentaje: ((valor / totalGastos) * 100).toFixed(1)
  })).sort((a, b) => b.valor - a.valor);

  const COLORES = ['#ef4444', '#f97316', '#f59e0b', '#84cc16', '#10b981', '#06b6d4', '#3b82f6', '#6366f1', '#8b5cf6'];

  const iniciarEdicion = (id, monto, tipo) => {
    setEditando({ id, tipo });
    setValorTemp(monto.toString());
  };

  const guardarEdicion = async () => {
    const nuevoMonto = parseFloat(valorTemp);
    if (!isNaN(nuevoMonto) && nuevoMonto >= 0) {
      try {
        if (editando.tipo === 'gasto') {
          await fetch(`http://localhost:3001/api/gastos/${editando.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ monto: nuevoMonto })
          });
        } else {
          await fetch(`http://localhost:3001/api/ingresos/${editando.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ monto: nuevoMonto })
          });
        }
        cargarDatos();
      } catch (error) {
        console.error('Error al guardar:', error);
      }
    }
    setEditando(null);
    setValorTemp('');
  };

  const cancelarEdicion = () => {
    setEditando(null);
    setValorTemp('');
  };

  const eliminarRegistro = async (id, tipo) => {
    try {
      if (tipo === 'gasto') {
        await fetch(`http://localhost:3001/api/gastos/${id}`, { method: 'DELETE' });
      } else {
        await fetch(`http://localhost:3001/api/ingresos/${id}`, { method: 'DELETE' });
      }
      cargarDatos();
    } catch (error) {
      console.error('Error al eliminar:', error);
    }
  };

  const agregarIngreso = async () => {
    if (!nuevoIngreso.concepto || !nuevoIngreso.monto) return;
    
    try {
      await fetch('http://localhost:3001/api/ingresos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...nuevoIngreso,
          monto: parseFloat(nuevoIngreso.monto),
          fecha: new Date()
        })
      });
      setNuevoIngreso({ concepto: '', monto: '', persona: 'P1' });
      cargarDatos();
    } catch (error) {
      console.error('Error al agregar ingreso:', error);
    }
  };

  const agregarGasto = async () => {
    if (!nuevoGasto.concepto || !nuevoGasto.monto) return;
    
    try {
      await fetch('http://localhost:3001/api/gastos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...nuevoGasto,
          monto: parseFloat(nuevoGasto.monto),
          fecha: new Date()
        })
      });
      setNuevoGasto({ concepto: '', monto: '', categoria: 'Vivienda', responsable: 'P1' });
      cargarDatos();
    } catch (error) {
      console.error('Error al agregar gasto:', error);
    }
  };

  const formatMonto = (monto) => {
    return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 0 }).format(monto);
  };

  const regla502030 = {
    necesidades: totalIngresos * 0.5,
    deseos: totalIngresos * 0.3,
    ahorros: totalIngresos * 0.2
  };

  const porcentajeGastos = ((totalGastos / totalIngresos) * 100).toFixed(1);
  const porcentajeDisponible = ((balance / totalIngresos) * 100).toFixed(1);

  // Datos para comparación
  const [datosComparacion, setDatosComparacion] = useState(null);
  useEffect(() => {
    if (comparar) {
      compararMeses();
    }
  }, [comparar, anio, mes, anio2, mes2]);

  const compararMeses = async () => {
    try {
      const response = await fetch(
        `http://localhost:3001/api/comparacionmeses?mes1=${mes}&anio1=${anio}&mes2=${mes2}&anio2=${anio2}`
      );
      const data = await response.json();
      setDatosComparacion(data);
    } catch (error) {
      console.error('Error al comparar meses:', error);
    }
  };

  // Exportar reporte
  const exportarReporte = async () => {
    try {
      const response = await fetch(`http://localhost:3001/api/exportar?mes=${mes}&anio=${anio}`);
      const data = await response.json();
      
      // Crear archivo JSON
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `reporte_presupuesto_${anio}_${mes}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error al exportar:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Users className="text-indigo-600" size={40} />
            <h1 className="text-4xl font-bold text-slate-800">Presupuesto Familiar</h1>
          </div>
          <p className="text-slate-600">Análisis conjunto de ingresos y gastos mensuales</p>
          
          <div className="flex flex-wrap items-center gap-4 mt-4 p-4 bg-white rounded-lg shadow">
            <div className="flex items-center gap-2">
              <Calendar className="text-slate-600" size={20} />
              <label className="text-slate-700">Mes:</label>
              <select 
                value={mes} 
                onChange={(e) => setMes(parseInt(e.target.value))}
                className="border border-slate-300 rounded px-2 py-1"
              >
                {[...Array(12)].map((_, i) => (
                  <option key={i+1} value={i+1}>{format(new Date(2023, i), 'MMMM', { locale: es })}</option>
                ))}
              </select>
            </div>
            
            <div className="flex items-center gap-2">
              <label className="text-slate-700">Año:</label>
              <select 
                value={anio} 
                onChange={(e) => setAnio(parseInt(e.target.value))}
                className="border border-slate-300 rounded px-2 py-1"
              >
                {[2023, 2024, 2025, 2026].map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>
            
            <button 
              onClick={() => setComparar(!comparar)}
              className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
            >
              <CompareArrows size={20} />
              {comparar ? 'Cerrar Comparación' : 'Comparar Meses'}
            </button>
            
            <button 
              onClick={exportarReporte}
              className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
            >
              <Download size={20} />
              Exportar
            </button>
          </div>
        </div>

        {/* Comparación de meses */}
        {comparar && datosComparacion && (
          <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
            <h2 className="text-2xl font-bold text-slate-800 mb-4">Comparación de Meses</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="border-2 border-slate-200 rounded-lg p-4">
                <h3 className="font-bold text-lg text-slate-700 mb-2">
                  {format(new Date(datosComparacion.mes1.anio, datosComparacion.mes1.mes - 1), 'MMMM yyyy', { locale: es })}
                </h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-slate-600">Ingresos:</span>
                    <span className="font-bold text-green-700">{formatMonto(datosComparacion.mes1.totalIngresos)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Gastos:</span>
                    <span className="font-bold text-red-700">{formatMonto(datosComparacion.mes1.totalGastos)}</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t">
                    <span className="text-slate-700 font-semibold">Balance:</span>
                    <span className={`font-bold ${datosComparacion.mes1.balance >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                      {formatMonto(datosComparacion.mes1.balance)}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="border-2 border-slate-200 rounded-lg p-4">
                <h3 className="font-bold text-lg text-slate-700 mb-2">
                  {format(new Date(datosComparacion.mes2.anio, datosComparacion.mes2.mes - 1), 'MMMM yyyy', { locale: es })}
                </h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-slate-600">Ingresos:</span>
                    <span className="font-bold text-green-700">{formatMonto(datosComparacion.mes2.totalIngresos)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Gastos:</span>
                    <span className="font-bold text-red-700">{formatMonto(datosComparacion.mes2.totalGastos)}</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t">
                    <span className="text-slate-700 font-semibold">Balance:</span>
                    <span className={`font-bold ${datosComparacion.mes2.balance >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                      {formatMonto(datosComparacion.mes2.balance)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Resumen de Balance */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-green-50 border-2 border-green-200 rounded-xl p-6 shadow-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-green-700 font-semibold text-sm">Ingresos Totales</span>
              <TrendingUp className="text-green-600" size={24} />
            </div>
            <p className="text-3xl font-bold text-green-800">{formatMonto(totalIngresos)}</p>
            <p className="text-xs text-green-600 mt-1">100%</p>
          </div>

          <div className="bg-red-50 border-2 border-red-200 rounded-xl p-6 shadow-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-red-700 font-semibold text-sm">Gastos Totales</span>
              <TrendingDown className="text-red-600" size={24} />
            </div>
            <p className="text-3xl font-bold text-red-800">{formatMonto(totalGastos)}</p>
            <p className="text-xs text-red-600 mt-1">{porcentajeGastos}% del ingreso</p>
          </div>

          <div className={`${balance >= 0 ? 'bg-blue-50 border-blue-200' : 'bg-orange-50 border-orange-200'} border-2 rounded-xl p-6 shadow-lg`}>
            <div className="flex items-center justify-between mb-2">
              <span className={`${balance >= 0 ? 'text-blue-700' : 'text-orange-700'} font-semibold text-sm`}>Balance</span>
              {balance >= 0 ? <DollarSign className="text-blue-600" size={24} /> : <AlertCircle className="text-orange-600" size={24} />}
            </div>
            <p className={`text-3xl font-bold ${balance >= 0 ? 'text-blue-800' : 'text-orange-800'}`}>{formatMonto(balance)}</p>
            <p className={`text-xs ${balance >= 0 ? 'text-blue-600' : 'text-orange-600'} mt-1`}>{porcentajeDisponible}% disponible</p>
          </div>

          <div className="bg-purple-50 border-2 border-purple-200 rounded-xl p-6 shadow-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-purple-700 font-semibold text-sm">Capacidad Ahorro</span>
              <DollarSign className="text-purple-600" size={24} />
            </div>
            <p className="text-3xl font-bold text-purple-800">{formatMonto(Math.max(0, balance))}</p>
            <p className="text-xs text-purple-600 mt-1">Por mes</p>
          </div>
        </div>

        {/* Resumen por persona */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-blue-500">
            <h3 className="font-bold text-slate-700 mb-3 flex items-center gap-2">
              <span className="bg-blue-500 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm">P1</span>
              Persona 1
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-600">Ingresos:</span>
                <span className="font-bold text-green-700">{formatMonto(ingresosP1)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Gastos:</span>
                <span className="font-bold text-red-700">{formatMonto(gastosP1)}</span>
              </div>
              <div className="flex justify-between pt-2 border-t">
                <span className="text-slate-700 font-semibold">Balance:</span>
                <span className="font-bold text-blue-700">{formatMonto(ingresosP1 - gastosP1)}</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-purple-500">
            <h3 className="font-bold text-slate-700 mb-3 flex items-center gap-2">
              <span className="bg-purple-500 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm">P2</span>
              Persona 2
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-600">Ingresos:</span>
                <span className="font-bold text-green-700">{formatMonto(ingresosP2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Gastos:</span>
                <span className="font-bold text-red-700">{formatMonto(gastosP2)}</span>
              </div>
              <div className="flex justify-between pt-2 border-t">
                <span className="text-slate-700 font-semibold">Balance:</span>
                <span className="font-bold text-purple-700">{formatMonto(ingresosP2 - gastosP2)}</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-amber-500">
            <h3 className="font-bold text-slate-700 mb-3 flex items-center gap-2">
              <span className="bg-amber-500 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm">+</span>
              Ingresos Extra
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-600">Alimento Horacio:</span>
                <span className="font-bold text-green-700">{formatMonto(ingresosExtra)}</span>
              </div>
              <p className="text-xs text-slate-500 mt-3">Este ingreso extra aumenta la capacidad de ahorro familiar</p>
            </div>
          </div>
        </div>

        {/* Alerta de salud financiera */}
        {balance >= 0 && (
          <div className="bg-green-100 border-l-4 border-green-500 p-4 mb-8 rounded-r-lg">
            <div className="flex items-start">
              <DollarSign className="text-green-600 mr-3 flex-shrink-0 mt-1" size={20} />
              <div>
                <p className="font-semibold text-green-800">¡Excelente salud financiera!</p>
                <p className="text-green-700 text-sm mt-1">
                  Tienen un excedente mensual de {formatMonto(balance)}. Esto representa el {porcentajeDisponible}% de sus ingresos totales. 
                  Consideren destinar este excedente a ahorros, inversiones o un fondo de emergencia.
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Gráfico de torta */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-2xl font-bold text-slate-800 mb-4">Distribución de Gastos</h2>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={dataCategoria}
                  dataKey="valor"
                  nameKey="nombre"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label={({ porcentaje }) => `${porcentaje}%`}
                >
                  {dataCategoria.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORES[index % COLORES.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => formatMonto(value)} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Gráfico de barras */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-2xl font-bold text-slate-800 mb-4">Gastos por Categoría</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={dataCategoria}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="nombre" angle={-45} textAnchor="end" height={100} fontSize={12} />
                <YAxis />
                <Tooltip formatter={(value) => formatMonto(value)} />
                <Bar dataKey="valor" fill="#6366f1" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Regla 50/30/20 */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <h2 className="text-2xl font-bold text-slate-800 mb-4">Regla 50/30/20 (Referencia)</h2>
          <p className="text-slate-600 mb-4 text-sm">Esta regla sugiere: 50% necesidades, 30% deseos, 20% ahorros</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-sm text-blue-700 font-semibold mb-1">Necesidades (50%)</p>
              <p className="text-2xl font-bold text-blue-800">{formatMonto(regla502030.necesidades)}</p>
              <p className="text-xs text-blue-600 mt-1">Vivienda, comida, servicios básicos</p>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg">
              <p className="text-sm text-purple-700 font-semibold mb-1">Deseos (30%)</p>
              <p className="text-2xl font-bold text-purple-800">{formatMonto(regla502030.deseos)}</p>
              <p className="text-xs text-purple-600 mt-1">Entretenimiento, salidas, caprichos</p>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <p className="text-sm text-green-700 font-semibold mb-1">Ahorros (20%)</p>
              <p className="text-2xl font-bold text-green-800">{formatMonto(regla502030.ahorros)}</p>
              <p className="text-xs text-green-600 mt-1">Inversiones, fondo de emergencia</p>
            </div>
          </div>
        </div>

        {/* Formulario para agregar nuevo ingreso */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <h2 className="text-2xl font-bold text-slate-800 mb-4">Agregar Nuevo Ingreso</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Concepto</label>
              <input
                type="text"
                value={nuevoIngreso.concepto}
                onChange={(e) => setNuevoIngreso({...nuevoIngreso, concepto: e.target.value})}
                className="w-full px-3 py-2 border border-slate-300 rounded-md"
                placeholder="Descripción del ingreso"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Monto</label>
              <input
                type="number"
                value={nuevoIngreso.monto}
                onChange={(e) => setNuevoIngreso({...nuevoIngreso, monto: e.target.value})}
                className="w-full px-3 py-2 border border-slate-300 rounded-md"
                placeholder="Monto"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Persona</label>
              <select
                value={nuevoIngreso.persona}
                onChange={(e) => setNuevoIngreso({...nuevoIngreso, persona: e.target.value})}
                className="w-full px-3 py-2 border border-slate-300 rounded-md"
              >
                <option value="P1">Persona 1</option>
                <option value="P2">Persona 2</option>
                <option value="Extra">Extra</option>
              </select>
            </div>
            <div className="flex items-end">
              <button
                onClick={agregarIngreso}
                className="w-full bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors"
              >
                Agregar Ingreso
              </button>
            </div>
          </div>
        </div>

        {/* Detalle de Ingresos */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <h2 className="text-2xl font-bold text-slate-800 mb-4">Detalle de Ingresos Familiares</h2>
          <div className="space-y-2">
            {ingresos.map(ingreso => (
              <div key={ingreso.id} className={`flex justify-between items-center p-3 rounded-lg hover:bg-green-100 transition-colors ${
                ingreso.persona === 'P1' ? 'bg-blue-50' : ingreso.persona === 'P2' ? 'bg-purple-50' : 'bg-amber-50'
              }`}>
                <div className="flex items-center gap-3">
                  <span className={`${
                    ingreso.persona === 'P1' ? 'bg-blue-500' : ingreso.persona === 'P2' ? 'bg-purple-500' : 'bg-amber-500'
                  } text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold`}>
                    {ingreso.persona === 'Extra' ? '+' : ingreso.persona}
                  </span>
                  <span className="text-slate-700 font-medium">{ingreso.concepto}</span>
                </div>
                <div className="flex items-center gap-2">
                  {editando && editando.id === ingreso.id && editando.tipo === 'ingreso' ? (
                    <>
                      <input
                        type="number"
                        value={valorTemp}
                        onChange={(e) => setValorTemp(e.target.value)}
                        className="w-32 px-2 py-1 border border-slate-300 rounded text-right"
                        autoFocus
                      />
                      <button onClick={guardarEdicion} className="text-green-600 hover:text-green-700">
                        <Save size={18} />
                      </button>
                      <button onClick={cancelarEdicion} className="text-red-600 hover:text-red-700">
                        <X size={18} />
                      </button>
                    </>
                  ) : (
                    <>
                      <span className="text-green-700 font-bold">{formatMonto(ingreso.monto)}</span>
                      <button onClick={() => iniciarEdicion(ingreso.id, ingreso.monto, 'ingreso')} className="text-slate-400 hover:text-slate-600">
                        <Edit2 size={16} />
                      </button>
                      <button onClick={() => eliminarRegistro(ingreso.id, 'ingreso')} className="text-red-400 hover:text-red-600">
                        <X size={16} />
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-4 border-t-2 border-slate-200 flex justify-between items-center">
            <span className="text-lg font-bold text-slate-800">Total Ingresos Familiares</span>
            <span className="text-2xl font-bold text-green-700">{formatMonto(totalIngresos)}</span>
          </div>
        </div>

        {/* Formulario para agregar nuevo gasto */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <h2 className="text-2xl font-bold text-slate-800 mb-4">Agregar Nuevo Gasto</h2>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Concepto</label>
              <input
                type="text"
                value={nuevoGasto.concepto}
                onChange={(e) => setNuevoGasto({...nuevoGasto, concepto: e.target.value})}
                className="w-full px-3 py-2 border border-slate-300 rounded-md"
                placeholder="Descripción del gasto"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Monto</label>
              <input
                type="number"
                value={nuevoGasto.monto}
                onChange={(e) => setNuevoGasto({...nuevoGasto, monto: e.target.value})}
                className="w-full px-3 py-2 border border-slate-300 rounded-md"
                placeholder="Monto"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Categoría</label>
              <select
                value={nuevoGasto.categoria}
                onChange={(e) => setNuevoGasto({...nuevoGasto, categoria: e.target.value})}
                className="w-full px-3 py-2 border border-slate-300 rounded-md"
              >
                <option value="Vivienda">Vivienda</option>
                <option value="Supermercado">Supermercado</option>
                <option value="Compras Varias">Compras Varias</option>
                <option value="Cuotas">Cuotas</option>
                <option value="Transporte">Transporte</option>
                <option value="Servicios">Servicios</option>
                <option value="Salud">Salud</option>
                <option value="Suscripciones">Suscripciones</option>
                <option value="Otro">Otro</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Responsable</label>
              <select
                value={nuevoGasto.responsable}
                onChange={(e) => setNuevoGasto({...nuevoGasto, responsable: e.target.value})}
                className="w-full px-3 py-2 border border-slate-300 rounded-md"
              >
                <option value="P1">Persona 1</option>
                <option value="P2">Persona 2</option>
              </select>
            </div>
            <div className="flex items-end">
              <button
                onClick={agregarGasto}
                className="w-full bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors"
              >
                Agregar Gasto
              </button>
            </div>
          </div>
        </div>

        {/* Detalle de Gastos */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-2xl font-bold text-slate-800 mb-4">Detalle de Gastos Familiares</h2>
          <div className="space-y-2">
            {gastos.map(gasto => (
              <div key={gasto.id} className={`flex justify-between items-center p-3 rounded-lg hover:bg-slate-100 transition-colors ${
                gasto.responsable === 'P1' ? 'bg-blue-50' : 'bg-purple-50'
              }`}>
                <div className="flex items-center gap-3 flex-1">
                  <span className={`${
                    gasto.responsable === 'P1' ? 'bg-blue-500' : 'bg-purple-500'
                  } text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold`}>
                    {gasto.responsable}
                  </span>
                  <div className="flex-1">
                    <span className="text-slate-700 font-medium">{gasto.concepto}</span>
                    <span className="ml-3 text-xs bg-slate-200 text-slate-600 px-2 py-1 rounded">{gasto.categoria}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {editando && editando.id === gasto.id && editando.tipo === 'gasto' ? (
                    <>
                      <input
                        type="number"
                        value={valorTemp}
                        onChange={(e) => setValorTemp(e.target.value)}
                        className="w-32 px-2 py-1 border border-slate-300 rounded text-right"
                        autoFocus
                      />
                      <button onClick={guardarEdicion} className="text-green-600 hover:text-green-700">
                        <Save size={18} />
                      </button>
                      <button onClick={cancelarEdicion} className="text-red-600 hover:text-red-700">
                        <X size={18} />
                      </button>
                    </>
                  ) : (
                    <>
                      <span className="text-red-700 font-bold">{formatMonto(gasto.monto)}</span>
                      <button onClick={() => iniciarEdicion(gasto.id, gasto.monto, 'gasto')} className="text-slate-400 hover:text-slate-600">
                        <Edit2 size={16} />
                      </button>
                      <button onClick={() => eliminarRegistro(gasto.id, 'gasto')} className="text-red-400 hover:text-red-600">
                        <X size={16} />
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-4 border-t-2 border-slate-200 flex justify-between items-center">
            <span className="text-lg font-bold text-slate-800">Total Gastos Familiares</span>
            <span className="text-2xl font-bold text-red-700">{formatMonto(totalGastos)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PresupuestoPersonal;
