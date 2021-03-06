import { Injectable } from '@angular/core';
import {SQLite, SQLiteObject} from '@ionic-native/sqlite/ngx';
import {BehaviorSubject, Observable} from 'rxjs';
import {SQLitePorter} from '@ionic-native/sqlite-porter/ngx';
import {Platform} from '@ionic/angular';
import {HttpClient} from '@angular/common/http';
import {Obras} from "./obras/obras";
import {Trabajo} from "./trabajos/trabajo";
import {Motivo} from "./motivos/motivo";
import {Usuarios} from "./usuarios/usuarios";
import {Fichajes} from "./fichajes/fichajes";

@Injectable({
  providedIn: 'root'
})
export class DbLocalService {
  private storage: SQLiteObject;
  // eslint-disable-next-line @typescript-eslint/member-ordering
  userList = new BehaviorSubject([]);
  // eslint-disable-next-line @typescript-eslint/member-ordering
  obrasList = new BehaviorSubject([]);
  // eslint-disable-next-line @typescript-eslint/member-ordering
  trabajosList = new BehaviorSubject([]);
  // eslint-disable-next-line @typescript-eslint/member-ordering
  motivosList = new BehaviorSubject([]);
  // eslint-disable-next-line @typescript-eslint/member-ordering
  fichajesList = new BehaviorSubject([]);
  private baseDatosPreparada: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);

  constructor(
    private platform: Platform,
    private sqlite: SQLite,
    private sqlPorter: SQLitePorter,
    private httpCliente: HttpClient
  ) {
    this.platform.ready().then(() =>{
      this.sqlite.create({
        name: 'solysur_db.db',
        location: 'default'
      })
        .then((db: SQLiteObject) => {
          this.storage = db;
          this.obtenerUsuarios();
          this.obtenerObras();
          this.obtenerTrabajos();
          this.obtenerMotivos();
          this.obtenerFichajes();
          this.getFakeData();
        });
    });
  }

  dbState() {
    return this.baseDatosPreparada.asObservable();
  }

  //me devuelve la lista de los datos de usuarios
  fetchUsers(): Observable<Usuarios[]>{
    return this.userList.asObservable();
  }

  //me devuelve la lista de los datos de obras
  fetchObra(): Observable<Obras[]>{
    return this.obrasList.asObservable();
  }

  //me devuelve la lista de los datos de trabajos
  fetchTrabajo(): Observable<Trabajo[]>{
    return this.trabajosList.asObservable();
  }

  //me devuelve la lista de los datos de motivos
  fetchMotivo(): Observable<Motivo[]>{
    return this.motivosList.asObservable();
  }

  //me devuelve la lista de los datos de fichajes
  fetchFichajes(): Observable<Motivo[]>{
    return this.fichajesList.asObservable();
  }

  //TODO Los siguientes metodos me insertan en las listas de sus respectivas "tablas" los datos que sacan de la consulta
  obtenerUsuarios(){
    return this.storage.executeSql('SELECT * FROM usertable', []).then(res =>{
      const items: Usuarios[] = [];
      if(res.rows.length > 0){
        for (let i = 0; i < res.rows.length; i++) {
          items.push({
            userCategoria: res.rows.item(i).userCategoria,
            userDni: res.rows.item(i).userDni,
            userEmail: res.rows.item(i).userEmail,
            userName: res.rows.item(i).userName,
            userTrabajo: res.rows.item(i).userTrabajo,
            userContrasenia: res.rows.item(i).userContrasenia
          });
        }
      }
      this.userList.next(items);
    });
  }

  obtenerObras(){
    return this.storage.executeSql('SELECT * FROM obrastable', []).then(res =>{
      const items: Obras[] = [];
      if(res.rows.length > 0){
        for (let i = 0; i < res.rows.length; i++) {
          items.push({
            obraLatitud: res.rows.item(i).obraLatitud,
            obraLongitud: res.rows.item(i).obraLongitud,
            obraName: res.rows.item(i).obraName,
          });
        }
      }
      this.obrasList.next(items);
    });
  }

  obtenerTrabajos(){
    return this.storage.executeSql('SELECT * FROM trabajostable', []).then(res =>{
      const items: Trabajo[] = [];
      if(res.rows.length > 0){
        for (let i = 0; i < res.rows.length; i++) {
          items.push({
            identificadorTrabajo: res.rows.item(i).identificadorTrabajo,
            nombreTrabajo: res.rows.item(i).nombreTrabajo,
          });
        }
      }
      this.trabajosList.next(items);
    });
  }

  obtenerMotivos(){
    return this.storage.executeSql('SELECT * FROM motivostable', []).then(res =>{
      const items: Motivo[] = [];
      if(res.rows.length > 0){
        for (let i = 0; i < res.rows.length; i++) {
          items.push({
            identificadorMotivo: res.rows.item(i).identificadorMotivo,
            nombreMotivo: res.rows.item(i).nombreMotivo,
          });
        }
      }
      this.motivosList.next(items);
    });
  }

  obtenerFichajes(){
    return this.storage.executeSql('SELECT * FROM fichajestable', []).then(res =>{
      const items: Fichajes[] = [];
      if(res.rows.length > 0){
        for (let i = 0; i < res.rows.length; i++) {
          items.push({
            fichajeNombre: res.rows.item(i).fichajeNombre,
            fichajeDni: res.rows.item(i).fichajeDni,
            fichajeTrabajo: res.rows.item(i).fichajeTrabajo,
            fichajeObra: res.rows.item(i).fichajeObra,
            fichajeEstadoEntrada: res.rows.item(i).fichajeEstadoEntrada,
            fichajeEstadoSalida: res.rows.item(i).fichajeEstadoSalida,
            fichajeMotivoEntrada: res.rows.item(i).fichajeMotivoEntrada,
            fichajeMotivoSalida: res.rows.item(i).fichajeMotivoSalida,
            fichajeFechaDia: res.rows.item(i).fichajeFechaDia,
            fichajeFechaMes: res.rows.item(i).fichajeFechaMes,
            fichajeFechaAnio: res.rows.item(i).fichajeFechaAnio,
            fichajeHoraEntrada: res.rows.item(i).fichajeHoraEntrada,
            fichajeHoraSalida: res.rows.item(i).fichajeHoraSalida,
            fichajeIdentificador: res.rows.item(i).fichajeIdentificador,
          });
        }
      }
      this.fichajesList.next(items);
    });
  }

  //este metodo me carga en archivo sql que tengo donde se crean las tablas
  getFakeData() {
    this.httpCliente.get(
      'assets/dump.sql',
      {responseType: 'text'}
    ).subscribe(data => {
      this.sqlPorter.importSqlToDb(this.storage, data)
        .then(_ => {
          this.obtenerUsuarios();
          this.obtenerObras();
          this.obtenerTrabajos();
          this.obtenerMotivos();
          this.obtenerFichajes();
          this.baseDatosPreparada.next(true);
        })
        .catch(error => console.error(error));
    });
  }

  //TODO Los siguiientes metodos me a??aden datos en sus respectivas tablas
  aniadirUsuarios(categoria, dni, email, name, trabajo, contrasenia){
    const data = [categoria, dni, email, name, trabajo, contrasenia];
    // eslint-disable-next-line max-len
    return this.storage.executeSql('INSERT INTO usertable (userCategoria, userDni, userEmail, userName, userTrabajo, userContrasenia) VALUES (?, ?, ?, ?, ?, ?)', data)
      .then(res => {
        this.obtenerUsuarios();
      });
  }

  aniadirObras(obraLatitud, obraLongitud, obraName){
    const dataObra = [obraLatitud, obraLongitud, obraName];
    // eslint-disable-next-line max-len
    return this.storage.executeSql('INSERT INTO obrastable (obraLatitud, obraLongitud, obraName) VALUES (?, ?, ?)', dataObra)
      .then(res => {
        this.obtenerObras();
      });
  }

  aniadirTrabajos(identificadorTrabajo, nombreTrabajo){
    const dataTrabajo = [identificadorTrabajo, nombreTrabajo];
    // eslint-disable-next-line max-len
    return this.storage.executeSql('INSERT INTO trabajostable (identificadorTrabajo,nombreTrabajo ) VALUES (?, ?)', dataTrabajo)
      .then(res => {
        this.obtenerTrabajos();
      });
  }

  aniadirMotivos(identificadorMotivo, nombreMotivo){
    const dataMotivo = [identificadorMotivo, nombreMotivo];
    // eslint-disable-next-line max-len
    return this.storage.executeSql('INSERT INTO motivostable (identificadorMotivo,nombreMotivo ) VALUES (?, ?)', dataMotivo)
      .then(res => {
        this.obtenerMotivos();
      });
  }

  aniadirFichajes(fichajeNombre,
                  fichajeDni,
                  fichajeTrabajo,
                  fichajeObra,
                  fichajeEstadoEntrada,
                  fichajeEstadoSalida,
                  fichajeMotivoEntrada,
                  fichajeMotivoSalida,
                  fichajeFechaDia,
                  fichajeFechaMes,
                  fichajeFechaAnio,
                  fichajeHoraEntrada,
                  fichajeHoraSalida,
                  fichajeIdentificador){
    // eslint-disable-next-line max-len
    const dataFichaje = [fichajeNombre,fichajeDni,fichajeTrabajo,fichajeObra,fichajeEstadoEntrada,fichajeEstadoSalida,fichajeMotivoEntrada,fichajeMotivoSalida, fichajeFechaDia, fichajeFechaMes, fichajeFechaAnio, fichajeHoraEntrada, fichajeHoraSalida, fichajeIdentificador];
    // eslint-disable-next-line max-len
    return this.storage.executeSql('INSERT INTO fichajestable (fichajeNombre,fichajeDni,fichajeTrabajo,fichajeObra,fichajeEstadoEntrada,fichajeEstadoSalida,fichajeMotivoEntrada,fichajeMotivoSalida, fichajeFechaDia, fichajeFechaMes, fichajeFechaAnio, fichajeHoraEntrada, fichajeHoraSalida, fichajeIdentificador) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)', dataFichaje)
      .then(res => {
        this.obtenerFichajes();
      });
  }

  //TODO Los siguientes metodos me borran los datos de sus respectivas tablas
  borrarDatosTablaUsers(){
    return this.storage.executeSql('DELETE FROM usertable' )
      .then(res => {
        this.obtenerUsuarios();
      });
  }

  borrarDatosTablaObras(){
    return this.storage.executeSql('DELETE FROM obrastable' )
      .then(res => {
        this.obtenerObras();
      });
  }

  borrarDatosTablaTrabajos(){
    return this.storage.executeSql('DELETE FROM trabajostable' )
      .then(res => {
        this.obtenerTrabajos();
      });
  }

  borrarDatosTablaMotivos(){
    return this.storage.executeSql('DELETE FROM motivostable' )
      .then(res => {
        this.obtenerMotivos();
      });
  }

  borrarDatosTablaFichajes(){
    return this.storage.executeSql('DELETE FROM fichajestable' )
      .then(res => {
        this.obtenerFichajes();
      });
  }

  //me obtiene los datos de un usuario con un email determinado
  obtenerUsuarioPorEmail(email){
    return this.storage.executeSql('SELECT * FROM usertable WHERE userEmail = ?', [email]).then(res => {
      if(res.rows.length === 0){
        return false;
      }else{
        return {
          userCategoria: res.rows.item(0).userCategoria,
          userDni: res.rows.item(0).userDni,
          userEmail: res.rows.item(0).userEmail,
          userName: res.rows.item(0).userName,
          userTrabajo: res.rows.item(0).userTrabajo,
          userContrasenia: res.rows.item(0).userContrasenia
        };
      }
    });
  }

  //me obtiene los fichajes con un dni de usuario determinado
  obtenerFichajePorDni(dni){
    console.log(dni);
    // eslint-disable-next-line max-len
    return this.storage.executeSql('SELECT * FROM fichajestable WHERE fichajeDni = ? AND fichajeHoraSalida IS NULL',[dni]).then(res =>{
      if(res.rows.length === 0){
        console.log('no hay datos');
        return false;
      }else{
        console.log('si hay datos');
          return {
            fichajeNombre: res.rows.item(0).fichajeNombre,
            fichajeDni: res.rows.item(0).fichajeDni,
            fichajeTrabajo: res.rows.item(0).fichajeTrabajo,
            fichajeObra: res.rows.item(0).fichajeObra,
            fichajeEstadoEntrada: res.rows.item(0).fichajeEstadoEntrada,
            fichajeEstadoSalida: res.rows.item(0).fichajeEstadoSalida,
            fichajeMotivoEntrada: res.rows.item(0).fichajeMotivoEntrada,
            fichajeMotivoSalida: res.rows.item(0).fichajeMotivoSalida,
            fichajeFechaDia: res.rows.item(0).fichajeFechaDia,
            fichajeFechaMes: res.rows.item(0).fichajeFechaMes,
            fichajeFechaAnio: res.rows.item(0).fichajeFechaAnio,
            fichajeHoraEntrada: res.rows.item(0).fichajeHoraEntrada,
            fichajeHoraSalida: res.rows.item(0).fichajeHoraSalida,
            fichajeIdentificador: res.rows.item(0).fichajeIdentificador,
          };
      }
    });
  }

  //me actualiza los datos del fichaje
  actualizarFichaje(fichajeHoraSalida,fichajeEstadoSalida,fichajeMotivoSalida,fichajeIdentificador){
    const dataFichaje = [fichajeHoraSalida,fichajeEstadoSalida,fichajeMotivoSalida,fichajeIdentificador];
    // eslint-disable-next-line max-len
    return this.storage.executeSql(`UPDATE fichajestable set fichajeHoraSalida = ?,fichajeEstadoSalida = ?, fichajeMotivoSalida = ? WHERE fichajeIdentificador = ?`, dataFichaje)
      .then(res => {
        this.obtenerTrabajos();
      });
  }

  //me obtiene los datos de una obra con un nombre determinado
  obtenerObraPorNombre(nombre){
    return this.storage.executeSql('SELECT * FROM obrastable WHERE obraName = ?', [nombre]).then(res => {
      if(res.rows.length === 0){
        return false;
      }else{
        return {
          obraLatitud: res.rows.item(0).obraLatitud,
          obraLongitud: res.rows.item(0).obraLongitud,
          obraName: res.rows.item(0).obraName,
        };
      }
    });
  }
}
