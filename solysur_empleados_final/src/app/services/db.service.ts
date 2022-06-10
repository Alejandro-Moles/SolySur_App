import { Injectable } from '@angular/core';
import {doc, Firestore, setDoc, getDoc, collection, getDocs, query, orderBy, where, updateDoc} from '@angular/fire/firestore';
import {AngularFirestore} from '@angular/fire/compat/firestore';
import {Observable} from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class DbService {

  constructor(private fireStore: Firestore) { }

  //me saca los datos de los empleados que tiene un email en especifico
  async sacarEmpleado(email){
    const empleadosRef = collection(this.fireStore,'users');
    const q = query(empleadosRef, where('userEmail', '==', email));
    return await getDocs(q);
  }

  //me saca los datos de las obras
  obtenerDatosObras(){
    let querySnapshot;
    return querySnapshot = getDocs(collection(this.fireStore, 'obras'));
  }

  //me saca los datos de los trabajos
  obtenerDatosTrabajos(){
    let querySnapshot;
    return querySnapshot = getDocs(collection(this.fireStore, 'trabajos'));
  }

  //me saca los datos de los fichajes
  sacarFichajes(){
    let querySnapshot;
    return querySnapshot = getDocs(collection(this.fireStore, 'fichajes'));
  }

  //me inserta un fichaje
  async realizarFichaje(nombre, dni, trabajo, nombreObra, estadoEmpleado, motivo, diaFecha,mesFecha,anioFecha, horaEntrada, horaSalida){
    const identificador = nombre+' '+diaFecha+'-'+mesFecha+'-'+anioFecha+ ' ' +horaEntrada;
    try{
      const empleadoFichaje = doc(this.fireStore, `fichajes/${identificador}`);
      await setDoc(empleadoFichaje, {
        fichajeNombre: nombre,
        fichajeDni: dni,
        fichajeTrabajo: trabajo,
        fichajeObra: nombreObra,
        fichajeEstadoEntrada: estadoEmpleado,
        fichajeEstadoSalida: '',
        fichajeMotivoEntrada: motivo,
        fichajeMotivoSalida: '',
        fichajeFechaDia: diaFecha,
        fichajeFechaMes: mesFecha,
        fichajeFechaAnio: anioFecha,
        fichajeHoraEntrada: horaEntrada,
        fichajeHoraSalida: horaSalida,
        fichajeIdentificador: identificador
      });
      return true;
    }catch (err){
      console.log(err);
      return false;
    }
  }

  //saca un fichaje donde el dni es un deni en especifico y la hoar de salida es null
  async sacarFichaje(dni){
    const fichajesRef = collection(this.fireStore,'fichajes');
    console.log('Este es el dni '+dni);

    const q = query(fichajesRef,
      //filtrar, por que la hora final sea el valor por defecto "null", unicamente va a ver un registro que
      // cumpla esta condicion, que sera cuando el empleado este trabajando.
      where('fichajeHoraSalida', '==', null),
      where('fichajeDni', '==', dni));

    const docSnap = await getDocs(q);
    return docSnap;
  }

  //me actualiza un fichaje
  async actualizarFichaje(nombre,dia,mes,anio,horaEntrada, horaSalida, motivoSalida, estadoSalida){
    const identificador = nombre+' '+dia+'-'+mes+'-'+anio+ ' ' +horaEntrada;
    try{
      const empleadoFichaje = doc(this.fireStore, `fichajes/${identificador}`);
      await updateDoc(empleadoFichaje, {
        fichajeHoraSalida: horaSalida,
        fichajeEstadoSalida: estadoSalida,
        fichajeMotivoSalida: motivoSalida
      });
    }catch(err){
    }
  }

  //me obtiene los datos de la tabla de motivos
  obtenerDatosMotivos(){
    let querySnapshot;
    return querySnapshot = getDocs(collection(this.fireStore, 'motivos'));
  }

  //me saca el empleado que use el email que le paso
  async sacarEmpleadoEmail(email){
    const empleadosRef = collection(this.fireStore,'users');
    const q = query(empleadosRef, where('userEmail', '==', email));
    return await getDocs(q);
  }

  //me saca los datos de la tabala de usuarios
  obtenerDatosEmpleados(){
    let querySnapshot;
    return querySnapshot = getDocs(collection(this.fireStore, 'users'));
  }

  //me sincroniza los datos de la base de datos local con la externa
  sincronizarFichajesInsertar(value){
    value.forEach(data =>{
      const fichajesDocRef =doc(this.fireStore, `fichajes/${data.fichajeIdentificador}`);
      try{
        setDoc(fichajesDocRef, {
          fichajeNombre: data.fichajeNombre,
          fichajeDni: data.fichajeDni,
          fichajeTrabajo: data.fichajeTrabajo,
          fichajeObra: data.fichajeObra,
          fichajeEstadoEntrada: data.fichajeEstadoEntrada,
          fichajeEstadoSalida: data.fichajeEstadoSalida,
          fichajeMotivoEntrada: data.fichajeMotivoEntrada,
          fichajeMotivoSalida: data.fichajeMotivoSalida,
          fichajeFechaDia: data.fichajeFechaDia,
          fichajeFechaMes: data.fichajeFechaMes,
          fichajeFechaAnio: data.fichajeFechaAnio,
          fichajeHoraEntrada: data.fichajeHoraEntrada,
          fichajeHoraSalida: data.fichajeHoraSalida,
          fichajeIdentificador: data.fichajeIdentificador
        });
      }catch(err){
        console.log(err);
      }
    });
  }

  sincronizarFichajesActualizar(value){
    value.forEach(data =>{
      const fichajeDocRef = doc(this.fireStore, `fichajes/${data.fichajeIdentificador}`);
      try{
        updateDoc(fichajeDocRef, {
          fichajeHoraSalida: data.fichajeHoraSalida,
          fichajeEstadoSalida: data.fichajeEstadoSalida,
          fichajeMotivoSalida: data.fichajeMotivoSalida
        });
      }catch(err){
        console.log(err);
      }
    });
  }

  //me saca los datos de la obra pasandole un nombre de la obra
  async sacarObraPorNombre(nombre){
    const empleadosRef = collection(this.fireStore,'obras');
    const q = query(empleadosRef, where('obraName', '==', nombre));
    return await getDocs(q);
  }


}
