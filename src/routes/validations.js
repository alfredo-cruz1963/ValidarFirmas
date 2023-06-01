const yup = require('yup');

function validate(validation, datos) {
    return (req, res, next) => {
        try {
             validation(datos);

            next();
        } catch (error) {
            next(error);
        }
    };
}

function createSedesValidation1(data) {
    return (req, res, next) => {
        try {
            console.log('-------------------------- Validacion -----------------------------------------------');
            console.log(data);
            const schema = yup.object().shape({
                codpae: yup.string().min(5).max(12).matches(/^[0-9]+$/).required(),
                nombsede: yup.string().min(5).max(60).matches(/^[a-z0-9]+$/).required(),
                codmpio: yup.string().max(5).matches(/^[0-9]+$/).required(),
                cupo: yup.number().min(1).max(5, 'no debe contener mas de 5 digitos').integer().required(),
            });
        
            schema.validateSync(data);
            next();
        } catch (error)  {
            next(error);
        }
    }
}    

function createSedesValidation(data) {
    console.log('-------------------------- Validacion -----------------------------------------------');
    console.log(data);
    const schema = yup.object().shape({
        codpae: yup.string().min(5).max(12).matches(/^[0-9]+$/).required(),
        nombsede: yup.string().min(5).max(60).matches(/^[a-z0-9]+$/).required(),
        codmpio: yup.string().max(5).matches(/^[0-9]+$/).required(),
        cupo: yup.number().min(1).max(5, 'no debe contener mas de 5 digitos').integer().required(),
    });

    schema.validateSync(data);
}

//function createAlumnosValidation(data) {
//    const schema = yup.object().shape({
//        name: yup.string().min(5).matches(/^[a-z]+$/).required(),
//        age: yup.number().min(1).max(100).integer().required(),
//        email: yup.string().matches(/^[a-z0-9_.]+@[a-z0-9]+\.[a-z0-9_.]+$/).required(),
//    });

//    schema.validateSync(data);
//}


module.exports = {
    validate,
    createSedesValidation,
};
