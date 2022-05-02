import React, {useEffect, useContext, useState} from 'react';
import { useRouter } from 'next/router';
import Layout from '../../components/layout/Layout';
import { FirebaseContext } from '../../firebase';
import { getDoc, doc, updateDoc, deleteDoc } from "firebase/firestore";
import Error404 from '../../components/layout/Error404';
import { css } from '@emotion/react';
import styled from '@emotion/styled';
import formatDistanceToNow from 'date-fns/formatDistanceToNow';
import { es } from 'date-fns/locale';
import {Campo, InputSubmit} from '../../components/ui/Formulario';
import Boton from '../../components/ui/Boton';

const ContenedorProducto = styled.div`
    @media (min-width: 768px) {
        display: grid;
        grid-template-columns: 2fr 1fr;
        column-gap: 2rem;
    }
`;

const CreadorProducto = styled.p`
    padding: .5rem 2rem;
    background-color: var(--naranja);
    color: #fff;
    text-transform: uppercase;
    font-weight: bold;
    display: inline-block;
    text-align: center;
    border-radius: 1rem;
`;

const Producto = () => {
    
    const [producto, setProducto] = useState({});
    const [error, setError] = useState(false);
    const [comentario, setComentario] = useState({});
    const [consultarDB, setConsultarDB] = useState(true);

    //Routing para obtener el id actual
    const router = useRouter();
    const {query:{id}} = router;

    const {firebase, usuario} = useContext(FirebaseContext);

    useEffect(() => {
        if(id && consultarDB) {
            const obtenerProducto = async () => {
                const docRef = doc(firebase.db, 'productos', id);
                const docSnap = await getDoc(docRef);
                if(docSnap.exists()) {
                    setProducto(docSnap.data())
                    setConsultarDB(false)
                } else {
                    setError(true)
                    setConsultarDB(false)
                }
            }
            obtenerProducto()
        }
    }, [id, producto]);

    if(Object.keys(producto).length === 0 && !error) return 'Cargando...';
    const {comentarios, creado, descripcion, creador, empresa, nombre, url, urlImagen, votos, haVotado} = producto;

    //Administrar y validar los votos
    const votarProducto = () => {
        if(!usuario) {
            return router.push('/login');
        }
        //Obtener y sumar nuevo voto
        const nuevoTotal = votos + 1;
        //Verificar si el usuario actual ha votado
        if(haVotado.includes(usuario.uid)) return;
        //Guardar el id del usuario que ha votado
        const hanVotado = [...haVotado, usuario.uid];
        //Actz en la BD
        const votosRef = doc(firebase.db, 'productos', id);
        updateDoc(votosRef, {votos: nuevoTotal, haVotado: hanVotado})
        //Actz state
        setProducto({
            ...producto,
            votos: nuevoTotal
        })
        setConsultarDB(true);
    }

    //Funciones para crear comentarios
    const comentarioChange = e => {
        setComentario({
            ...comentarios,
            [e.target.name] : e.target.value
        })
    }

    // Identifica si el comentario es el creador del producto
    const esCreador = id => {
        if(creador.id == id) {
            return true;
        }
    }
    const agregarComentario = e => {
        e.preventDefault();
        if(!usuario) {
            return router.push('/login');
        }
        //Informacion extra al comentario
        comentario.usuarioId = usuario.uid;
        comentario.usuarioNombre = usuario.displayName;

        //Tomar copia de comentarios y agregarlos al arreglo
        const nuevoComentarios = [...comentarios, comentario];

        //Actz BD
        const comentariosRef = doc(firebase.db, 'productos', id);
        updateDoc(comentariosRef, {comentarios: nuevoComentarios});

        //Actz State
        setProducto({
            ...producto,
            comentarios: nuevoComentarios
        });
        setConsultarDB(true);
    }

    //Funcion que revisa que el creador del producto sea el mismo que esta autenticado
    const puedeBorrar = () => {
        if(!usuario) return false;
        if(creador.id === usuario.uid) {
            return true
        }
    }

    // Elimina un producto de la BD
    const eliminarProducto = async () => {
        if(!usuario) {
            return router.push('/login')
        }

        if(creador.id !== usuario.uid) {
            return router.push('/')
        }

        try {
            await deleteDoc(doc(firebase.db, "productos", id));
            router.push('/')
        } catch (error) {
            console.log(error);
        }
    }

    return (
        <Layout>
            <>
                {error ? <Error404/> : (
                    <div className='contenedor'>
                        <h1 css={css`
                            text-align: center;
                            margin-top: 5rem;
                        `}>
                            {nombre}
                        </h1>
                        <ContenedorProducto>
                            <div>
                                <p>Publicado hace: {formatDistanceToNow(new Date(creado), {locale: es})}</p>
                                <p>Publicado por: {creador.nombre} de {empresa}</p>
                                <img src={urlImagen} />
                                <p>{descripcion}</p>
                                {usuario && (
                                    <>
                                        <h2>Agrega tu comentario</h2>
                                        <form
                                            onSubmit={agregarComentario}
                                        >
                                            <Campo>
                                                <input 
                                                    type='text'
                                                    name='mensaje'
                                                    onChange={comentarioChange}
                                                />
                                            </Campo>
                                            <InputSubmit 
                                                type='submit'
                                                value='Agregar Comentario'
                                            />
                                        </form>
                                    </>
                                )}
                                <h2
                                    css={css`
                                        margin: 2rem 0;
                                    `}
                                >
                                    Comentarios    
                                </h2>
                                {comentarios.length === 0 ? 'Aun no hay comentarios' : (
                                    <ul>
                                        {comentarios.map((comentario, i) => (
                                            <li
                                                key={`${comentario.usuarioId}-${i}`}
                                                css={css`
                                                    border: 1px solid #e1e1e1;
                                                    padding: 2rem;
                                                `}
                                            >
                                                <p>{comentario.mensaje}</p>
                                                <p>Escrito por: {' '} 
                                                    <span
                                                        css={css`
                                                            font-weight: bold;
                                                        `}
                                                    >
                                                        {comentario.usuarioNombre}
                                                    </span>
                                                </p>
                                                {esCreador(comentario.usuarioId) && (
                                                    <CreadorProducto>El creador</CreadorProducto>
                                                )}
                                            </li>
                                        ))}
                                    </ul>
                                )}
                                
                            </div>

                            <aside>
                                <Boton
                                    target='_blank'
                                    bgColor='true'
                                    href={url}
                                >
                                    Visitar URL
                                </Boton>
                                
                                <div
                                    css={css`
                                        margin-top: 5rem;
                                    `}
                                >
                                    <p
                                        css={css`
                                            text-align: center;
                                            `}
                                    >{votos} Votos</p>
                                    {usuario && (
                                        <Boton
                                            onClick={votarProducto}
                                        >Votar</Boton>
                                    )}
                                </div>
                                
                            </aside>
                        </ContenedorProducto>
                        {puedeBorrar() && 
                            <Boton
                                onClick={eliminarProducto}
                            >Eliminar Producto</Boton>
                        }
                    </div>
                )}
                
            </>
        </Layout>
    )
}

export default Producto