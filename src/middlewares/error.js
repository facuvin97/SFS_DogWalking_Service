const fs = require('fs'); 
const path = require('path');

module.exports = function (err, req, res, next) {
  

  // // Si se subió algún archivo durante la ejecución del endpoint, lo elimino
  // if (req.file) { // si es un solo archivo
  //   const filePath = path.join(__dirname, '..', '..', 'uploads', 'shows', req.file.filename); // Ajusta la ruta

  //   console.log('filepath: ', filePath);
    
  //   if (fs.existsSync(filePath)) {
  //     fs.unlinkSync(filePath); // Elimina el archivo
  //   }
  // }

  // if (req.files) {
  //   req.files.forEach(file => { // si son varios archivos
  //     const filePath = path.join(__dirname, '..', '..', 'uploads', 'shows', file.filename); // Ajusta la ruta
  //     if (fs.existsSync(filePath)) {
  //       fs.unlinkSync(filePath); // Elimina el archivo
  //     }
  //   });
  // }

  let response = {
    ok: false,
    error: {
      code: err.code || 500, //si no hay codigo de error, tiro un error 500
      message: err.message || 'Internal server error',
      details: err.details || 'No hay detalles'
    }
  }

  // si el error es de NotFound
  if (err.message === 'Not Found') {
    response.error.code = 404
    response.error.message = 'Not Found'
    response.error.details = err
  }



  res.status(200).json(response)

}