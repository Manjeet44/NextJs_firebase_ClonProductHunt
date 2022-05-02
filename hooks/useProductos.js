import React, {useEffect, useState, useContext} from "react";
import { FirebaseContext } from "../firebase";
import { collection, getDocs} from "firebase/firestore";

const useProductos = () => {

    const [productos, setProductos] = useState([]);
    const {firebase} = useContext(FirebaseContext);
    const {db} = firebase;

    useEffect(() => {
      const obtenerProductos = async () => {
        try {
          const querySnapshot = await getDocs(collection(db, 'productos'));
          const docs = [];
          querySnapshot.forEach((doc) => {
            docs.push({...doc.data(), id: doc.id})
          });
          setProductos(docs);
        } catch (error) {
          console.log(error)
        }
      }
      obtenerProductos()
    }, []);
    return {
        productos
    }
}

export default useProductos;