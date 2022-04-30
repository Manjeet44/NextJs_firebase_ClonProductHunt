import { initializeApp } from 'firebase/app';
import {createUserWithEmailAndPassword, getAuth, updateProfile, signInWithEmailAndPassword, signOut} from 'firebase/auth';
import firebaseConfig from './config';

class Firebase {
    constructor() {
        initializeApp(firebaseConfig);
        this.auth = getAuth();
    }

    //Registra un usuario
    async registrar(nombre, email, password) {
        const nuevoUsuario = await createUserWithEmailAndPassword( this.auth, email, password );
        return await updateProfile( nuevoUsuario.user, {
            displayName: nombre
        });
    }
    // Inicia sesion del usuario
    async login(email, password) {
        return await signInWithEmailAndPassword(this.auth, email, password);
    }

    //Cierra la sesion del usuario
    async cerrarSesion() {
        await signOut(this.auth);
    }
}

export const firebase = new Firebase();
export default firebase;