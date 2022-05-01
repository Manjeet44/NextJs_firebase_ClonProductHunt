import React, {useState, useContext} from "react";
import { css } from "@emotion/react";
import Router, {useRouter} from "next/router";
import Layout from "../components/layout/Layout";
import { Formulario, Campo, InputSubmit, Error } from "../components/ui/Formulario";
import {collection, addDoc} from 'firebase/firestore';
import Error404 from "../components/layout/Error404";

import {FirebaseContext} from "../firebase";
import { ref, getDownloadURL, uploadBytesResumable } from "firebase/storage";

//Validaciones
import useValidacion from "../hooks/useValidacion";
import validarCrearProducto from "../validacion/validarCrearProducto";

const STATE_INICIAL = {
  nombre: '',
  empresa: '',
  imagen: '',
  url: '',
  descripcion: ''
}

const NuevoProducto = () => {

  const [error, guardarError] = useState(false);
  const { valores, errores, handleSubmit, handleChange, handleBlur } = useValidacion(STATE_INICIAL, validarCrearProducto, crearProducto);
  const {nombre, empresa, imagen, url, descripcion} = valores;

  //Hook de routing
  const router = useRouter();

  //Context con las operaciones crud de firebase
  const {usuario, firebase} = useContext(FirebaseContext);
  const {db} = firebase;

  //States para la subida de la imagen
  const [uploading, setUploading] = useState(false);
  const [urlImagen, setUrlImagen] = useState('');

  const handleSubidaImagen = e => {
    //Obtiene referencia de la ubicacion donde se guardara la imagen
    const file = e.target.files[0];
    const imagenRef = ref(firebase.storage, 'imagen/' + file.name);
    
    //Iniciar subida
    setUploading(true);
    const uploadTask = uploadBytesResumable(imagenRef, file);
    
    //Detectar eventor para cuando detecte un cambio en el estado de la subida
    uploadTask.on('state_changed',
      (snapshot )=> {
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        console.log(`Subiendo imagen: ${progress} % terminado`);
      },
      // En caso de error
      error => {
        setUploading(false);
        console.log(error);
      },
      //Subida finalizada correctamente
      () => {
        setUploading(false);
        getDownloadURL(uploadTask.snapshot.ref).then(url => {
          console.log('Imagen Disponible', url);
          setUrlImagen(url);
        });
      }
    );
  };

  async function crearProducto() {
    //Si el usuario no esta autenticado llevar al login
    if(!usuario) {
      return router.push('/login');
    }
    //Crear objeto de nuevo producto
    const producto = {
      nombre,
      empresa,
      url,
      urlImagen,
      descripcion,
      votos :0,
      comentarios: [],
      creado: Date.now(),
      creador: {
        id: usuario.uid,
        nombre: usuario.displayName
      },
      haVotado: []
    }

    //Insertarlo en la BD
    const productos = await addDoc(collection(db, 'productos'), (producto));
    return router.push('/');
   
  }

  return (
    <div>
      <Layout>
        {!usuario ? <Error404/> : (
          <>
            <h1
              css={css`
                text-align: center;
                margin-top: 5rem;
                color: var(--naranja);
              `}
            >Nuevo Producto</h1>
            <Formulario
              onSubmit={handleSubmit}
            >
              <fieldset>
                <legend>Informacion General</legend>
                <Campo>
                  <label htmlFor="nombre">Nombre</label>
                  <input
                    type='text'
                    id='nombre'
                    placeholder="Nombre del Producto"
                    name="nombre"
                    value={nombre}
                    onChange={handleChange}
                    onBlur={handleBlur}
                  />
                </Campo>
                {errores.nombre && <Error>{errores.nombre}</Error>}

                <Campo>
                  <label htmlFor="empresa">Empresa</label>
                  <input
                    type='text'
                    id='empresa'
                    placeholder="Nombre Empresa"
                    name="empresa"
                    value={empresa}
                    onChange={handleChange}
                    onBlur={handleBlur}
                  />
                </Campo>
                {errores.empresa && <Error>{errores.empresa}</Error>}

                <Campo>
                  <label htmlFor="imagen">Imagen</label>
                  <input
                    accept="image/*"
                    type='file'
                    id='imagen'
                    name="imagen"
                    onChange={handleSubidaImagen}
                  />
                </Campo>
                {errores.imagen && <Error>{errores.imagen}</Error>}

                <Campo>
                  <label htmlFor="url">URL</label>
                  <input
                    type='url'
                    id='url'
                    name="url"
                    placeholder="URL de tu Producto"
                    value={url}
                    onChange={handleChange}
                    onBlur={handleBlur}
                  />
                </Campo>
                {errores.url && <Error>{errores.url}</Error>}
              </fieldset>

              <fieldset>
                <legend>Sobre tu Producto</legend>
                <Campo>
                  <label htmlFor="descripcion">Descripcion</label>
                  <textarea
                    id='descripcion'
                    name="descripcion"
                    value={descripcion}
                    onChange={handleChange}
                    onBlur={handleBlur}
                  />
                </Campo>
                {errores.descripcion && <Error>{errores.descripcion}</Error>}
              </fieldset>

              {error && <Error>{error}</Error>}
              <InputSubmit
                type='submit'
                value='Crear Producto'
              />
            </Formulario>
          </>
        )}
        
      </Layout>
    </div>
  )
}

export default NuevoProducto