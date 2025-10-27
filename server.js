const express = require('express');
const cors = require('cors');
const { Sequelize, DataTypes } = require('sequelize');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Configuración CORS
app.use(cors());
app.use(express.json());

// Configuración de la base de datos
const sequelize = new Sequelize(
  process.env.POSTGRES_DB || 'presupuesto_db',
  process.env.POSTGRES_USER || 'presupuesto_user',
  process.env.POSTGRES_PASSWORD || 'presupuesto_password',
  {
    host: process.env.DB_HOST || 'db',
    port: process.env.DB_PORT || 5432,
    dialect: 'postgres',
    logging: false
  }
);

// Modelos de la base de datos
const Ingreso = sequelize.define('Ingreso', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  concepto: {
    type: DataTypes.STRING,
    allowNull: false
  },
  monto: {
    type: DataTypes.FLOAT,
    allowNull: false
  },
  persona: {
    type: DataTypes.STRING,
    allowNull: false
  },
  fecha: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  }
});

const Gasto = sequelize.define('Gasto', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  concepto: {
    type: DataTypes.STRING,
    allowNull: false
  },
  monto: {
    type: DataTypes.FLOAT,
    allowNull: false
  },
  categoria: {
    type: DataTypes.STRING,
    allowNull: false
  },
  responsable: {
    type: DataTypes.STRING,
    allowNull: false
  },
  fecha: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  }
});

// Sincronizar modelos con la base de datos
sequelize.sync({ force: false }).then(() => {
  console.log('Base de datos sincronizada');
});

// Rutas API
app.get('/api/ingresos', async (req, res) => {
  try {
    const ingresos = await Ingreso.findAll({
      where: { fecha: { [Sequelize.Op.gte]: req.query.fecha_inicio } },
      order: [['fecha', 'DESC']]
    });
    res.json(ingresos);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/ingresos', async (req, res) => {
  try {
    const ingreso = await Ingreso.create(req.body);
    res.status(201).json(ingreso);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/ingresos/:id', async (req, res) => {
  try {
    const [updated] = await Ingreso.update(req.body, {
      where: { id: req.params.id }
    });
    if (updated) {
      const updatedIngreso = await Ingreso.findByPk(req.params.id);
      res.json(updatedIngreso);
    } else {
      res.status(404).json({ error: 'Ingreso no encontrado' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/ingresos/:id', async (req, res) => {
  try {
    const deleted = await Ingreso.destroy({
      where: { id: req.params.id }
    });
    if (deleted) {
      res.status(204).json();
    } else {
      res.status(404).json({ error: 'Ingreso no encontrado' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/gastos', async (req, res) => {
  try {
    const gastos = await Gasto.findAll({
      where: { fecha: { [Sequelize.Op.gte]: req.query.fecha_inicio } },
      order: [['fecha', 'DESC']]
    });
    res.json(gastos);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/gastos', async (req, res) => {
  try {
    const gasto = await Gasto.create(req.body);
    res.status(201).json(gasto);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/gastos/:id', async (req, res) => {
  try {
    const [updated] = await Gasto.update(req.body, {
      where: { id: req.params.id }
    });
    if (updated) {
      const updatedGasto = await Gasto.findByPk(req.params.id);
      res.json(updatedGasto);
    } else {
      res.status(404).json({ error: 'Gasto no encontrado' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/gastos/:id', async (req, res) => {
  try {
    const deleted = await Gasto.destroy({
      where: { id: req.params.id }
    });
    if (deleted) {
      res.status(204).json();
    } else {
      res.status(404).json({ error: 'Gasto no encontrado' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Endpoint para análisis mensual
app.get('/api/analisismensual', async (req, res) => {
  try {
    const { mes, anio } = req.query;
    const inicio = new Date(anio, mes - 1, 1);
    const fin = new Date(anio, mes, 0);

    const ingresos = await Ingreso.findAll({
      where: {
        fecha: {
          [Sequelize.Op.gte]: inicio,
          [Sequelize.Op.lte]: fin
        }
      }
    });

    const gastos = await Gasto.findAll({
      where: {
        fecha: {
          [Sequelize.Op.gte]: inicio,
          [Sequelize.Op.lte]: fin
        }
      }
    });

    // Agrupar por categoría
    const gastosPorCategoria = {};
    gastos.forEach(gasto => {
      if (!gastosPorCategoria[gasto.categoria]) {
        gastosPorCategoria[gasto.categoria] = 0;
      }
      gastosPorCategoria[gasto.categoria] += gasto.monto;
    });

    const totalIngresos = ingresos.reduce((sum, i) => sum + i.monto, 0);
    const totalGastos = gastos.reduce((sum, g) => sum + g.monto, 0);
    const balance = totalIngresos - totalGastos;

    res.json({
      mes,
      anio,
      totalIngresos,
      totalGastos,
      balance,
      gastosPorCategoria,
      ingresos,
      gastos
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Endpoint para comparar meses
app.get('/api/comparacionmeses', async (req, res) => {
  try {
    const { mes1, anio1, mes2, anio2 } = req.query;
    
    const inicio1 = new Date(anio1, mes1 - 1, 1);
    const fin1 = new Date(anio1, mes1, 0);
    const inicio2 = new Date(anio2, mes2 - 1, 1);
    const fin2 = new Date(anio2, mes2, 0);

    const ingresos1 = await Ingreso.findAll({
      where: {
        fecha: {
          [Sequelize.Op.gte]: inicio1,
          [Sequelize.Op.lte]: fin1
        }
      }
    });
    const gastos1 = await Gasto.findAll({
      where: {
        fecha: {
          [Sequelize.Op.gte]: inicio1,
          [Sequelize.Op.lte]: fin1
        }
      }
    });

    const ingresos2 = await Ingreso.findAll({
      where: {
        fecha: {
          [Sequelize.Op.gte]: inicio2,
          [Sequelize.Op.lte]: fin2
        }
      }
    });
    const gastos2 = await Gasto.findAll({
      where: {
        fecha: {
          [Sequelize.Op.gte]: inicio2,
          [Sequelize.Op.lte]: fin2
        }
      }
    });

    const totalIngresos1 = ingresos1.reduce((sum, i) => sum + i.monto, 0);
    const totalGastos1 = gastos1.reduce((sum, g) => sum + g.monto, 0);
    const balance1 = totalIngresos1 - totalGastos1;

    const totalIngresos2 = ingresos2.reduce((sum, i) => sum + i.monto, 0);
    const totalGastos2 = gastos2.reduce((sum, g) => sum + g.monto, 0);
    const balance2 = totalIngresos2 - totalGastos2;

    res.json({
      mes1: { mes: mes1, anio: anio1, totalIngresos: totalIngresos1, totalGastos: totalGastos1, balance: balance1 },
      mes2: { mes: mes2, anio: anio2, totalIngresos: totalIngresos2, totalGastos: totalGastos2, balance: balance2 }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Endpoint para exportar reporte
app.get('/api/exportar', async (req, res) => {
  try {
    const { mes, anio } = req.query;
    const inicio = new Date(anio, mes - 1, 1);
    const fin = new Date(anio, mes, 0);

    const ingresos = await Ingreso.findAll({
      where: {
        fecha: {
          [Sequelize.Op.gte]: inicio,
          [Sequelize.Op.lte]: fin
        }
      }
    });

    const gastos = await Gasto.findAll({
      where: {
        fecha: {
          [Sequelize.Op.gte]: inicio,
          [Sequelize.Op.lte]: fin
        }
      }
    });

    const totalIngresos = ingresos.reduce((sum, i) => sum + i.monto, 0);
    const totalGastos = gastos.reduce((sum, g) => sum + g.monto, 0);
    const balance = totalIngresos - totalGastos;

    // Crear un objeto con los datos del reporte
    const reporte = {
      periodo: `${mes}/${anio}`,
      totalIngresos,
      totalGastos,
      balance,
      ingresos: ingresos.map(i => ({ concepto: i.concepto, monto: i.monto, persona: i.persona })),
      gastos: gastos.map(g => ({ concepto: g.concepto, monto: g.monto, categoria: g.categoria, responsable: g.responsable }))
    };

    res.json(reporte);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
});
