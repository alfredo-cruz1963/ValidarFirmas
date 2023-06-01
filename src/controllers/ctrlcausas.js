const ctrlcausas = {};

const pool = require('../database');

// ********** despliega la pagina para adiccionar *************
ctrlcausas.add = async (req, res) => {
    res.render('causas/add.hbs');
};

// *********** adicciona a la BD *****************
ctrlcausas.new = async (req, res) => {
    const { codigo, descripcion } = req.body;
    const mcodigo = req.body.codigo;
    const causal = await pool.query('SELECT codigo FROM fcausales WHERE codigo = ?', mcodigo)
    const newCausal = {
        codigo,
        descripcion
    };

    if (causal.length > 0) {
      req.flash('message', 'Causal con el código ' + mcodigo + ', YA existe.');
      res.redirect('/causass/add');
    }

    newCausal.descripcion = newCausal.descripcion.toUpperCase();

    await pool.query('INSERT INTO fcausales set ?', [newCausal]);
    req.flash('success', 'Causa Grabada Correctamente');
    res.redirect('/causas');   
};

// ************* lista  **********************
ctrlcausas.list = async (req, res) => {
    const causal = await pool.query('SELECT * FROM fcausales');
    res.render('causas/list.hbs', { causal });
};

// ************** Delete *********************
ctrlcausas.delete = async (req, res) => {
    const { codigo } = req.params;
    await pool.query('DELETE FROM fcausales WHERE codigo = ?', [codigo]);
    req.flash('success', 'La Firma fue Borrada Correctamente');
    res.redirect('/causas');
};

// *********** trae el registro que va a editar ***********************
ctrlcausas.edit = async (req, res) => {
    const { codigo } = req.params;
    const causal = await pool.query('SELECT * FROM fcausales WHERE codigo = ?', [codigo]);
    res.render('causas/edit.hbs', { causal: causal[0] });
};

// ****************** actualiza en la BD ********************
ctrlcausas.update = async (req, res) => {
    const { id } = req.params;
    const { codigo, descripcion} = req.body; 
    const newCausal = {
        codigo,
        descripcion
    };
    
    newCausal.descripcion = newCausal.descripcion.toUpperCase();
    await pool.query('UPDATE fcausales set ? WHERE codigo = ?', [newCausal, codigo]);
    req.flash('success', 'La Causal se Actualizado Correctamente');
    res.redirect('/causas');
};

module.exports = ctrlcausas;