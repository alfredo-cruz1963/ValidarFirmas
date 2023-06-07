const ctrlpuestos = {};

const pool = require('../database');

// ********** despliega la pagina para adiccionar *************
ctrlpuestos.add = async (req, res) => {
    const cytes = await pool.query('SELECT * FROM dane') ;
    res.render('puestos/add.hbs', { cytes: cytes} );
};

// *********** adicciona a la BD *****************
ctrlpuestos.new = async (req, res) => {
    const { codigo, codmpio, nombpuesto, dir, mujeres, hombres, mesas } = req.body;
    const mcodigo = req.body.codigo;
    const newPuesto = {
        codigo,
        codmpio,
        nombpuesto,
        dir,
        mujeres,
        hombres,
        mesas
    }; 
 
    const puestos = await pool.query('SELECT codigo FROM divipol WHERE codigo = ?', mcodigo);   

    if (puestos.length > 0) {
      req.flash('message', 'Puesto con el código ' + mcodigo + ', YA existe.');
      res.redirect('/puestos/add');
    }

    await pool.query('INSERT INTO divipol set ?', [newPuesto]);
    req.flash('success', 'Puesto de votación se Grabo Correctamente');
    res.redirect('/puestos');   
};

// ************* lista  **********************
ctrlpuestos.list = async (req, res) => {
    const puestos = await pool.query('SELECT * FROM vptosmpio');
    res.render('puestos/list.hbs', { puestos });
};

// ************** Delete *********************
ctrlpuestos.delete = async (req, res) => {
    const { codigo } = req.params;
    await pool.query('DELETE FROM divipol WHERE codigo = ?', [codigo]);
    req.flash('success', 'El Puesto de Votación fue Borrado Correctamente');
    res.redirect('/puestos');
};

// *********** trae el registro que va a editar ***********************
ctrlpuestos.edit = async (req, res) => {
    const { codigo } = req.params;
    const puestos = await pool.query('SELECT * FROM vptosmpio WHERE codigo = ?', [codigo]);
    const cytes = await pool.query('SELECT * FROM dane');

    res.render('puestos/edit.hbs', { puestos: puestos[0], cytes: cytes });
};

// ****************** actualiza en la BD ********************
ctrlpuestos.update = async (req, res) => {
    const { id } = req.params;
     const { codigo, codmpio, nombpuesto, dir, mujeres, hombres, mesas } = req.body; 
    const newPuesto = {
        codigo,
        codmpio,
        nombpuesto,
        dir,
        mujeres,
        hombres,
        mesas
    };

    await pool.query('UPDATE divipol set ? WHERE codigo = ?', [newPuesto, codigo]);
    req.flash('success', 'El Puesto se Actualizado Correctamente');
    res.redirect('/puestos');
};

module.exports = ctrlpuestos;