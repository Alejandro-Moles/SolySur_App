import { Injectable } from '@angular/core';
import {
  doc,
  Firestore,
  setDoc,
  getDoc,
  collection,
  getDocs,
  query,
  orderBy,
  where,
  updateDoc
} from '@angular/fire/firestore';
import {AngularFirestore} from '@angular/fire/compat/firestore';
import {identity, Observable} from 'rxjs';
import {set} from "@angular/fire/database";


export interface Empleado{
  userDni: string;
  userEmail: string;
  userName: string;
  userTrabajo: string;
  userUid: string;
}

@Injectable({
  providedIn: 'root'
})
export class DbService {

  public arrayEmpleados: Array<any> = new Array();
  constructor(private fireStore: Firestore) { }

//TODO Los metodos estan comentados lo que hacen en el codigo de la aplicacion de solysur_empleados_final

  //metodo que comprueba si existe un documento con el id pasado
  async comprobarDatos(documentId: string){
    const docRef = doc(this.fireStore, 'users', documentId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      //existe los datos
      return true;
    } else {
      //no existen los datos
      return false;
    }
  }

  obtenerEmpleados(): Observable<Empleado[]> {
    const empleadosRef = collection(this.fireStore, 'users');
    const q = query(empleadosRef, orderBy('userName', 'desc'));
    // @ts-ignore
    return collection(q, {idfield: 'userDni'}) as unknown as Observable<Empleado[]>;
  }

  obtenerDatosEmpleados(){
    let querySnapshot;
    return querySnapshot = getDocs(collection(this.fireStore, 'users'));
  }

  obtenerDatosObras(){
    let querySnapshot;
    return querySnapshot = getDocs(collection(this.fireStore, 'obras'));
  }

  //me inserta un documento de la coleccion de obras
  async insertarObra(name, latitud, longitud){
    const obraName = name;
    const obraLongitud = longitud;
    const obraLatitud = latitud;
    try{
      const userDocRef = doc(this.fireStore, `obras/${obraName}`);
      await setDoc(userDocRef, {
        obraName,
        obraLongitud,
        obraLatitud
      });
      return true;
    }catch (err){
      console.log(err);
      return false;
    }
  }

  async obtenerDatosFichajes(dniEmpleado){
    const fichajesRef = collection(this.fireStore,'fichajes');
    const q = query(fichajesRef,
      where('fichajeDni', '==', dniEmpleado));

    const docSnap = await getDocs(q);
    return docSnap;
  }

  //me inserta un documento de la coleccion de trabajos
  async meterTrabajos(nombretrabajo, identificador){
    const trabajosRef = doc(this.fireStore, `trabajos/${identificador}`);
    try{
      await setDoc(trabajosRef,{
        nombreTrabajo: nombretrabajo,
        identificadorTrabajo: identificador
      });
      return 0;
    }catch (err){
      return 1;
    }
  }

  //me inserta un documento de la coleccion de motivos
  async meterMotivo(motivo, identificador){
    const trabajosRef = doc(this.fireStore, `motivos/${identificador}`);
    try{
      await setDoc(trabajosRef,{
        nombreMotivo: motivo,
        identificadorMotivo: identificador
      });
      return 0;
    }catch (err){
      return 1;
    }
  }

  obtenerDatosTrabajos(){
    let querySnapshot;
    return querySnapshot = getDocs(collection(this.fireStore, 'trabajos'));
  }

  async sacarAdministrador(email){
    const empleadosRef = collection(this.fireStore,'users');
    const q = query(empleadosRef, where('userEmail', '==', email));
    return await getDocs(q);
  }

  async sacarMotivos(){
    let querySnapshot;
    return querySnapshot = getDocs(collection(this.fireStore, 'motivos'));
  }

  async sacarFichajes(){
    let querySnapshot;
    return querySnapshot = getDocs(collection(this.fireStore, 'fichajes'));
  }

  async sacarMotivosPorIdentificador(identificador){
    const querySnapshot =collection(this.fireStore, 'motivos');
    console.log(identificador);
    const q = query(querySnapshot, where('identificadorMotivo', '==', identificador));
    return await getDocs(q);
  }

  async sacarTrabajosPorIdentificador(identificador){
    const querySnapshot =collection(this.fireStore, 'trabajos');
    console.log(identificador);
    const q = query(querySnapshot, where('identificadorTrabajo', '==', identificador));
    return await getDocs(q);
  }

  //me modifica un documento de la coleccion de motivos
  async modificarMotivo(motivoModificar, identificador){
    const motivosref = doc(this.fireStore, `motivos/${identificador}`);
    try{
      await updateDoc(motivosref,{
        nombreMotivo: motivoModificar,
      });
      return 0;
    }catch (err){
      return 1;
    }
  }

  async sacarTrabajos(){
    let querySnapshot;
    return querySnapshot = getDocs(collection(this.fireStore, 'trabajos'));
  }

  //me modifica un documento de la coleccion de trabajos
  async modificarTrabajo(trabajoModificar, identificador){
    const trabajosRef = doc(this.fireStore, `trabajos/${identificador}`);
    try{
      await updateDoc(trabajosRef,{
        nombreTrabajo: trabajoModificar,
      });
      return 0;
    }catch (err){
      console.log(err);
      return 1;
    }
  }

  //TODO Los siguientes metodos me sincronizan la base de datos local con la externa de sus respectivas tablas
  sincronizarDatosUsuarios(value){
    value.forEach(data =>{
      const userDocRef = doc(this.fireStore, `users/${data.userDni}`);
      try{
        setDoc(userDocRef, {
          userCategoria: data.userCategoria,
          userContrasenia: data.userContrasenia,
          userDni: data.userDni,
          userEmail: data.userEmail,
          userName: data.userName,
          userTrabajo: data.userTrabajo,
        });
        return true;
      }catch (err){
        console.log(err);
        return false;
      }
    });
  }

  sincronizarDatosObras(value){
    value.forEach(data =>{
      const obrasDocRef = doc(this.fireStore, `obras/${data.obraName}`);
      try{
        setDoc(obrasDocRef, {
          obraName: data.obraName,
          obraLatitud: data.obraLatitud,
          obraLongitud: data.obraLongitud,
        });
        return true;
      }catch (err){
        console.log(err);
        return false;
      }
    });
  }

  sincronizarDatosMotivosInsertar(value){
    value.forEach(data =>{
      const motivosDocRef = doc(this.fireStore, `motivos/${data.identificadorMotivo}`);
      try{
        setDoc(motivosDocRef, {
          nombreMotivo: data.nombreMotivo,
          identificadorMotivo: data.identificadorMotivo,
        });
        return true;
      }catch (err){
        console.log(err);
        return false;
      }
    });
  }

  sincronizarDatosMotivosActualizar(value){
    value.forEach(data =>{
      const motivosref = doc(this.fireStore, `motivos/${data.identificadorMotivo}`);
      try{
        updateDoc(motivosref,{
          nombreMotivo: data.nombreMotivo,
        });
        return 0;
      }catch (err){
        return 1;
      }
    });
  }

  sincronizarDatosTrabajosInsertar(value){
    value.forEach(data =>{
      console.log(JSON.stringify(data));
      const motivosDocRef = doc(this.fireStore, `trabajos/${data.identificadorTrabajo}`);
      try{
        setDoc(motivosDocRef, {
          nombreTrabajo: data.nombreTrabajo,
          identificadorTrabajo: data.identificadorTrabajo,
        });
        return true;
      }catch (err){
        console.log(err);
        return false;
      }
    });
  }

  sincronizarDatosTrabajosActualizar(value){
    value.forEach(data =>{
      console.log(JSON.stringify(data));
      const motivosDocRef = doc(this.fireStore, `trabajos/${data.identificadorTrabajo}`);
      try{
        updateDoc(motivosDocRef, {
          nombreTrabajo: data.nombreTrabajo,
        });
        return true;
      }catch (err){
        console.log(err);
        return false;
      }
    });
  }
}
