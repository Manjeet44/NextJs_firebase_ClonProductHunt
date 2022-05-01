import React, {useEffect, useState, useContext} from "react";
import Layout from "../components/layout/Layout";
import { FirebaseContext } from "../firebase";
import { collection, getDocs } from "firebase/firestore";
import DetallesProducto from "../components/layout/DetallesProducto";

const Home = () => {
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

    return (
      <div>
        <Layout>
          <div className="listado-productos">
            <div className="contenedor">
              <ul className="bg-white">
                {productos.map(producto => (
                  <DetallesProducto
                    key={producto.id}
                    producto={producto}
                  />
                ))}
              </ul>
            </div>
          </div>
        </Layout>
      </div>
    )
}

export default Home
