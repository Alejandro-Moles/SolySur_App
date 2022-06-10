import {Component, OnInit} from '@angular/core';
import {AuthService} from '../services/auth.service';
import {DbService} from '../services/db.service';
import {AlertController, LoadingController} from '@ionic/angular';
import {Router} from '@angular/router';
import {FormBuilder, FormGroup, Validators} from '@angular/forms';
import * as moment from 'moment';
import { Geolocation } from '@ionic-native/geolocation/ngx';
import {Storage} from '@ionic/storage-angular';
import {Network} from '@capacitor/network';
import {DbLocalService} from '../services/db-local.service';
import {CalculaDistanciaService} from "../services/calcula-distancia.service";


@Component({
  selector: 'app-tab2',
  templateUrl: 'tab2.page.html',
  styleUrls: ['tab2.page.scss']
})
export class Tab2Page implements OnInit {

  //variable que guarda todos los datos del fichaje
  datosFichajes: any;
  //variable que guarda los datos de todas las obras que hay
  datosObras: any;
  //variables que guardan el nombre, dni y trabajo del empleado
  nombreEmpleado: any;
  dniEmpleado: any;
  trabajoEmpleado: any;
  correoEmpleado: any;
  categoriaEmpleado: any;
  //esta variable indica mediante un booleano si el empleado esta en la obra o no
  comprobarLocalizacion = true;
  formulario: FormGroup;
  //esta variables indican cual es la latitud y longitud del empleado
  latitudTrabajador: any = 0;
  longitudTrabajador: any = 0;
  //esta variable indica si hay un fichaje abierto, es decir si tiene una hora de entrada pero no de salida
  fichajeAbierto: boolean;

  //esta variable nos indicara en el caso de que un fichaje este abierto la obra en la que esta el empleado
  textoObra: any;

  //esta variable guardara los datos que se necesitan del fichaje, como la obra en el que esta fichado el empleado
  datosMotivos: any;

  //esta variable me indica el estado de la red
  estado: any;
  //esta variable la usao para sincronizar los datos cuando vuelve el internet
  objetoFichaje: Array<any>;

  //estas son la latitud y longitud de la obra
  latitudObra: any;
  longitudObra: any;

  estaEnObra: boolean;
  constructor(
    private auth: AuthService,
    private db: DbService,
    private alertController: AlertController,
    private router: Router,
    private fb: FormBuilder,
    private geolocation: Geolocation,
    private loadingController: LoadingController,
    private storage: Storage,
    private dbLocal: DbLocalService,
    private distancia: CalculaDistanciaService
  ) {
  }

  //al iniciar el componente, cargo las variables del formulario
  async ngOnInit() {
    this.formulario = this.fb.group({
      //tendra una variable que sea la que indique el nombre de la obra, esta sera requerida,
      // es decir no se podrá activar el boton de fichar si no se elige un nombre
      nombreObra: ['', [Validators.required]],
      //etsa indica solo el motivo por el cual no se esta en la obra
      nombreMotivo: ['']
    });

    //este es un listener que creo y se ejecuta cada vez que se cambia el estado de la red
    Network.addListener('networkStatusChange', status => {
      if (status.connected) {
        //si hay conexion me sincroniza los datos a la base de datos externa
        this.estado = true;
        this.syncFichajesInsertar();
        this.syncFichajesActualizar();
        this.rellenarDatosOnline();
        this.comprobarInternet();
      } else {
        //si no simplemente muestra un mensaje indicando que no hay internet
        this.showAlert('Modo Offline', 'Ahora mismo usted no tiene conexion a internet');
        this.estado = false;
      }
    });
  }


  //este metodo se ejecuta caeda vez que la vista de la aplicacion va a entrar.
  // @ts-ignore
  async ionViewWillEnter(): boolean | Promise<any> {
    //cargamos de nuevo el formulario para que se "reinicien" las variables y no se queden guardadas en cache
    this.formulario = this.fb.group({
      nombreObra: ['', [Validators.required]],
      nombreMotivo: ['']
    });

    //compruebo si hay internet o si no dependiendo del resultado, me carga los datos desde la base local o externa
    const network = Network.getStatus().then(data => {
      this.estado = data.connected;
      if (!this.estado) {
        //aqui no hay internet
        this.rellenarDatosOffline();
      } else {
        //aqui si hay internet
        this.syncFichajesInsertar();
        this.syncFichajesActualizar();
        this.rellenarDatosOnline();
      }
    });
  }


  //este metodo hace un log out de la aplicacion, sacando al usuario actual que esta dentro
  async logOut() {
    const header = 'Cerrar Sesión';
    const message = '¿Estas seguro que quieres cerrar sesión?';
    //creo un alert dialog, el cual me pedira si cerrar la sesion, dependiendo de a que le de cerrara sesion o no
    const alert = await this.alertController.create({
      header,
      message,
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel',
          id: 'cancel-button',
          handler: (blah) => {
          }
        }, {
          text: 'Okay',
          id: 'confirm-button',
          handler: () => {
            //quita el email del storage, por lo que no entrara directamente la proxima vez
            this.storage.remove('email');
            //con esto navegara a la pagina principal
            this.router.navigateByUrl(``);
          }
        }
      ]
    });
    await alert.present();
  }

  //este metodo me cambia la variable al estado contrario, es decir si esta en true me la pasa a false, y
  // lo ejecutare cada vez que se de al checkbox
  checkLocalizacion() {
    this.comprobarLocalizacion = !this.comprobarLocalizacion;
  }

  //TODO 1.- Este es el primer metodo que se ejecuta, y que se llama al presionar el boton fichar
  async fichaje() {
    //primero comprueba si se esta en la obra o no, dependiendo de eso ejecuta diferentes metodos
    if (this.comprobarLocalizacion === false) {
      this.fichajeNoLocalizacionObra();
    } else {
      this.fichajeSiLocalizacionObra();
    }
  }

  //este metodo me muestra una alerta personalizada pasandole una cabecera y un texto
  async showAlert(header, message) {
    const alert = await this.alertController.create({
      header,
      message,
      buttons: ['OK'],
    });
    await alert.present();
  }

  //este metodo me saca las coordenadas actuales del empleado.
  obtenerCoordenadas() {
    this.geolocation.getCurrentPosition().then((resp) => {
      //la pasamos a kilometros para que luego se pueda comprobar si estan en el rango de la obra
      this.latitudTrabajador = resp.coords.latitude;
      this.longitudTrabajador = resp.coords.longitude;
    }).catch((error) => {
      this.showAlert('Error', 'Ha ocurrido un error al intentar obtener su localización');
    });
  }

  //TODO Este metodo se encarga de pasarle los datos necesarios al servicio de DBServicve para que meta en la base de datos el fichaje
  async insertarFichaje(estado, motivo) {
    //saco el mes, dia y año
    const mesFecha = moment().format('MM');
    const diaFecha = moment().format('DD');
    const anioFecha = moment().format('YYYY');

    //tambien saco la hora de entrada y salida, la de salida la coloco a null por que este fichaje es de entrada
    const horaEntrada = moment().format('HH:mm');
    const horaSalida = null;

    //creo un indentificador
    const identificador = this.dniEmpleado+diaFecha+mesFecha+horaEntrada;

    const loading = await this.loadingController.create();
    await loading.present();
    //llamo al metodo y le paso los parametros necesarios
    const fichaje = this.db.realizarFichaje(
      this.nombreEmpleado,
      this.dniEmpleado,
      this.trabajoEmpleado,
      this.formulario.value.nombreObra.obraName,
      estado,
      motivo,
      diaFecha,
      mesFecha,
      anioFecha,
      horaEntrada,
      horaSalida,
    );

    //doy un feedback para que el empleado sepa si se ha realizado bien el fichaje
    fichaje.then(data => {
      if (data) {
        loading.dismiss();
        //meto los datos en la base de datos local
        // eslint-disable-next-line max-len
        this.dbLocal.aniadirFichajes(this.nombreEmpleado,this.dniEmpleado,this.trabajoEmpleado,this.formulario.value.nombreObra.obraName, estado,'',motivo,'', diaFecha,mesFecha,anioFecha,horaEntrada,horaSalida, identificador);
        this.showAlert('Fichaje Realizado', 'El fichaje ha sido realizado con exito');
        this.ionViewWillEnter();
      } else {
        loading.dismiss();
        this.showAlert('Error al dar de alta', 'Ha habido un problema al realizar el fichaje');
      }
    });
  }

  //TODO este metodo es lo mismo que el de insertar el fichaje pero pasandole los datos necesario para en vez de insertar actualizar el fichaje
  async actualizarFichaje(estadoSalida, motivoSalida) {
    const horaSalida = moment().format('HH:mm');
    const loading = await this.loadingController.create();
    await loading.present();
    const fichaje = this.db.actualizarFichaje(this.datosFichajes[0].fichajeNombre,
      this.datosFichajes[0].fichajeFechaDia,
      this.datosFichajes[0].fichajeFechaMes,
      this.datosFichajes[0].fichajeFechaAnio,
      this.datosFichajes[0].fichajeHoraEntrada,
      horaSalida,
      motivoSalida,
      estadoSalida
    );

    if (fichaje) {
      await loading.dismiss();
      this.showAlert('Fichaje realizado', 'Se ha actualizado el fichaje');
      this.ionViewWillEnter();
    } else {
      await loading.dismiss();
      this.showAlert('Error al dar de alta', 'Ha habido un problema al actualizar el fichaje');
    }
  }

  //TODO Este metodo se ejecuta cuando realizo el fichaje pero el empleado no esta en la obra.
  async fichajeNoLocalizacionObra() {
    if (this.formulario.value.nombreMotivo.nombreMotivo === undefined) {
      this.showAlert('Error', 'Necesitas indicar un motivo');
    } else {
      const network = Network.getStatus().then(data => {
        this.estado = data.connected;
        if (!this.estado) {
          //aqui no hay internet
          this.realizarFichajeOffline('No esta en la obra', this.formulario.value.nombreMotivo.nombreMotivo);
        } else {
          //aqui si hay internet
          this.realizarFichajeOnline('No esta en la obra', this.formulario.value.nombreMotivo.nombreMotivo);
        }
      });
    }
  }

  //TODO este metodo se ejecutra cuando realizo el fichaje pero el empleado si esta en la obra
  async fichajeSiLocalizacionObra() {
    //para sacar los kilometros que son, hay que multiplicar la latitud y longitud por 111,319.
    this.obtenerCoordenadas();
    this.sacarCoordenadasObra();

    const distancia = this.distancia.sacarDistancia(this.longitudObra,this.longitudTrabajador,this.latitudObra,this.latitudTrabajador);
    if(isNaN(distancia)){
      this.showAlert('Error al sacar la posicion', 'Intente hacerlo de nuevo');
    }else{
      if(distancia < 0.15){
        const network = Network.getStatus().then(data => {
          this.estado = data.connected;
          if (!this.estado) {
            this.realizarFichajeOffline('Si esta en la obra','');
          } else {
            this.realizarFichajeOnline('Si esta en la obra', '');
          }
        });
      }else{
        this.showAlert('Error', 'Usted no esta en la obra');
      }
    }

  }

  //este metodo se ejecuta para rellenar el array de los difrenetes motivos que hay albergados en la base de datos
  async rellenarArrayMotivos() {
    this.datosMotivos = new Array();
    const motivos = await this.db.obtenerDatosMotivos();
    motivos.forEach((data) => {
      this.datosMotivos.push(data.data());
    });
  }

  //este metodo rellena el array de las diferentes obras que hay en la base de datos
  async rellenarArrayObras() {
    this.datosObras = new Array();
    const obras = this.db.obtenerDatosObras();
    obras.then(datos => {
      datos.forEach((data => {
        this.datosObras.push(data.data());
      }));
    });
  }


  //este metodo rellena los datos en el array de los fichajes, que se necesita para saber se esta el fichaje abierto o cerrado
  async rellenarArrayFichajes() {
    this.datosFichajes = new Array();
    const fichajeRealizado = await this.db.sacarFichaje(this.dniEmpleado);
    //se comprueba si la consulta me ha devuelto algo, es decir si esta vacia, si lo esta, quiere decir que no hay ningun
    //registro con el valor por defecto de null en la fecha de salida, lo que tambien significa que no hay ningun fichaje abierto
    if (fichajeRealizado.empty) {
      //aqui se tiene que crear un fichaje de cero
      this.fichajeAbierto = false;
    } else {
      //aqui se tiene que terminar un fichaje
      fichajeRealizado.forEach((doc) => {
        this.datosFichajes.push(doc.data());
      });
      this.fichajeAbierto = true;
    }
    if (this.fichajeAbierto) {
      this.textoObra = this.datosFichajes[0].fichajeObra;
    }
  }


  //este metodo sirve para meter en la base de datos local los datos de la externa de la tabla de usuarios
  insertardatosUsuarios() {
    const users = this.db.obtenerDatosEmpleados();
    // eslint-disable-next-line @typescript-eslint/no-shadow
    users.then(res => {
      res.forEach(usuario => {
        this.dbLocal.aniadirUsuarios(
          usuario.data().userCategoria,
          usuario.data().userDni,
          usuario.data().userEmail,
          usuario.data().userName,
          usuario.data().userTrabajo,
          usuario.data().userContrasenia
        );
      });
    });
  }

  //este metodo sirve para meter en la base de datos local los datos de la externa de la tabla de obras
  insertardatosObras() {
    const obras = this.db.obtenerDatosObras();
    obras.then(res => {
      res.forEach(obra => {
        this.dbLocal.aniadirObras(
          obra.data().obraLatitud,
          obra.data().obraLongitud,
          obra.data().obraName
        );
      });
    });
  }

  //este metodo sirve para meter en la base de datos local los datos de la externa de la tabla de trabajos
  insertardatosTrabajos() {
    const obras = this.db.obtenerDatosTrabajos();
    obras.then(res => {
      res.forEach(trabajo => {
        this.dbLocal.aniadirTrabajos(
          trabajo.data().identificadorTrabajo,
          trabajo.data().nombreTrabajo,
        );
      });
    });
  }

  //este metodo sirve para meter en la base de datos local los datos de la externa de la tabla de motivos
  insertardatosMotivos() {
    const obras = this.db.obtenerDatosMotivos();
    obras.then(res => {
      res.forEach(motivo => {
        this.dbLocal.aniadirMotivos(
          motivo.data().identificadorMotivo,
          motivo.data().nombreMotivo,
        );
      });
    });
  }

  //este metodo comprueba si hay acceso a internet, si lo hay me ejecuta todos los metodos para llenar la base de datos local
  //si no me hace el metodo para llenar los datos desde la base de datos local
  comprobarInternet() {
    const network = Network.getStatus().then(data => {
      this.estado = data.connected;
      if (!this.estado) {
          this.rellenarDatosOffline();
      } else {
        this.dbLocal.dbState().subscribe((res) => {
          if (res) {
            this.dbLocal.borrarDatosTablaUsers();
            this.dbLocal.borrarDatosTablaObras();
            this.dbLocal.borrarDatosTablaTrabajos();
            this.dbLocal.borrarDatosTablaMotivos();
            this.dbLocal.borrarDatosTablaFichajes();

            this.insertardatosUsuarios();
            this.insertardatosMotivos();
            this.insertardatosTrabajos();
            this.insertardatosObras();
            this.insertarFichajesBdLocal();
          }
        });
      }
    });
  }

  //este metodo me rellena los datos que voy a necesitar en el programa si hay internet
  async rellenarDatosOnline() {
    await this.storage.get('email').then(value => {
      this.rellenarVariablesEmpleados(value);
    });
  }

  //este metodo me rellena los datos que voy a necesitar en el programa si no hay internet
  async rellenarDatosOffline() {
    this.storage.get('email').then(value => {
      this.rellenarVariablesEmpleadoOffline(value);
    });
  }


  async rellenarVariablesEmpleados(value) {
    //relleno las variables de los datos de los empleados
    const empleados = await this.db.sacarEmpleado(value);
    empleados.forEach((doc) => {
      this.nombreEmpleado = doc.data().userName;
      this.dniEmpleado = doc.data().userDni;
      this.trabajoEmpleado = doc.data().userTrabajo;
      this.correoEmpleado = doc.data().userEmail;
      this.categoriaEmpleado = doc.data().userCategoria;
    });

    if (this.categoriaEmpleado) {
      this.categoriaEmpleado = 'Administrador';
    } else {
      this.categoriaEmpleado = 'Empleado';
    }

    //estos metodos me cargan de datos los arrays o las variables que necesito para que el programa funcione
    this.rellenarArrayFichajes();
    this.rellenarArrayObras();
    this.rellenarArrayMotivos();
  }


  rellenarVariablesEmpleadoOffline(value) {
    const user = this.dbLocal.obtenerUsuarioPorEmail(value);
    user.then(res => {
      if (res) {
        this.insertarDatosOffline(res);
      }
    });
  }

  //este metodo me carga en variables, y ejecuta los metodos que me cargan en array los datos si no hay internet
  insertarDatosOffline(res) {
    this.dniEmpleado = res.userDni;
    this.nombreEmpleado = res.userName;
    this.correoEmpleado = res.userEmail;
    this.categoriaEmpleado = res.userCategoria;
    this.trabajoEmpleado = res.userTrabajo;

    if (this.categoriaEmpleado) {
      this.categoriaEmpleado = 'Administrador';
    } else {
      this.categoriaEmpleado = 'Empleado';
    }

    this.rellenarArrayObrasOffline();
    this.rellenarArrayMotivosOffline();
    this.rellenarArrayFichajesOffline();
  }


  rellenarArrayObrasOffline() {
    this.datosObras = new Array();
    const obras = this.dbLocal.fetchObra();
    obras.subscribe(data => {
      this.datosObras = data;
    });
  }

  rellenarArrayMotivosOffline() {
    this.datosMotivos = new Array();
    const motivos = this.dbLocal.fetchMotivo();
    motivos.subscribe(data => {
      this.datosMotivos = data;
    });
  }

  //TODO Este metodo se ejecuta cuando se va a realizar un fichaje en modo online
  realizarFichajeOnline(estado, motivo){
    if (this.fichajeAbierto) {
      this.actualizarFichaje(estado, motivo);
    } else {
      this.insertarFichaje(estado, motivo);
    }
  }

  //TODO Este metodo se ejecuta cuando se va a realizar un fichaje en modo offline
  realizarFichajeOffline(estado, motivo){
    if(this.fichajeAbierto){
      this.actualizarFichajeOffline(estado, motivo);
    }else{
      this.insertarFichajeOffline(estado, motivo);
    }
  }

  //este metodo me realiza el fichaje si no hay internet
  async insertarFichajeOffline(estado, motivo){
    this.objetoFichaje = new Array();
    //saco el mes, dia y año
    const mesFecha = moment().format('MM');
    const diaFecha = moment().format('DD');
    const anioFecha = moment().format('YYYY');

    //tambien saco la hora de entrada y salida, la de salida la coloco a null por que este fichaje es de entrada
    const horaEntrada = moment().format('HH:mm');
    const horaSalida = null;

    //construyo el identificador
    const identificador = this.nombreEmpleado+' '+diaFecha+'-'+mesFecha+'-'+anioFecha+ ' ' +horaEntrada;

    //meto en una variable, los datos del fichaje
    const dato = {
      fichajeNombre: this.nombreEmpleado,
      fichajeDni: this.dniEmpleado,
      fichajeTrabajo: this.trabajoEmpleado,
      fichajeObra: this.formulario.value.nombreObra.obraName,
      fichajeEstadoEntrada: estado,
      fichajeEstadoSalida: '',
      fichajeMotivoEntrada: motivo,
      fichajeMotivoSalida: '',
      fichajeFechaDia: diaFecha,
      fichajeFechaMes: mesFecha,
      fichajeFechaAnio: anioFecha,
      fichajeHoraEntrada: horaEntrada,
      fichajeHoraSalida: horaSalida,
      fichajeIdentificador: identificador
    };
    //llamo al metodo y le paso los parametros necesarios
    const loading = await this.loadingController.create();
    await loading.present();
    // eslint-disable-next-line max-len
    this.dbLocal.aniadirFichajes(this.nombreEmpleado,this.dniEmpleado,this.trabajoEmpleado,this.formulario.value.nombreObra.obraName, estado,'',motivo,'', diaFecha,mesFecha,anioFecha,horaEntrada,horaSalida, identificador);
    //compruebo si en el storage hay datos que no se han sincronizado
    this.storage.get('fichajesInsertar').then(value=>{
      //si hay datos entonces por cada uno lo meto en una lista, y luego le añado el nuevo dato para mas tarde meterlo en el storage
      if(value !== null){
        value.forEach(data=>{
          this.objetoFichaje.push(data);
        });
        this.objetoFichaje.push(dato);
        this.storage.set('fichajesInsertar', this.objetoFichaje);
      }else{
        //si no hay meto el dato nuevo y lo añado al storage
        this.objetoFichaje.push(dato);
        this.storage.set('fichajesInsertar', this.objetoFichaje);
      }
    });
    this.showAlert('Fichaje realizado', 'Se ha registrado su hora de entrada');
    this.ionViewWillEnter();
    loading.dismiss();
  }

  //este metodo me actualiza el fichaje si no hay internet
  async actualizarFichajeOffline(estadoSalida, motivoSalida){
    this.objetoFichaje = new Array();
    const horaSalida = moment().format('HH:mm');
    const loading = await this.loadingController.create();
    await loading.present();

    this.dbLocal.obtenerFichajePorDni(this.dniEmpleado).then(data =>{
      if(data){
        //llamo al storage para hacer el mismo procedimiento que al insertar el fichaje en la bas de datos local pero para actualizar
        this.storageActualizarFichajeNoLocalizacion(data,horaSalida,estadoSalida,motivoSalida);
      }
    });
    this.showAlert('Fichaje realizado', 'Se ha registrado su hora de salida');
    loading.dismiss();
    this.ionViewWillEnter();
  }

  rellenarArrayFichajesOffline(){
    this.datosFichajes = new Array();
    const fichajes = this.dbLocal.fetchFichajes();
    fichajes.subscribe(data => {
      this.datosFichajes = data;
    });
    const fichaje = this.dbLocal.obtenerFichajePorDni(this.dniEmpleado);
    fichaje.then(data =>{
      if(!data){
        this.fichajeAbierto = false;
      }else{
        this.fichajeAbierto = true;
        this.textoObra = data.fichajeObra;
      }
    });
  }

  insertarFichajesBdLocal(){
      const fichajes = this.db.sacarFichajes();
      // eslint-disable-next-line @typescript-eslint/no-shadow
      fichajes.then(res => {
        res.forEach(fichaje => {
          this.dbLocal.aniadirFichajes(
            fichaje.data().fichajeNombre,fichaje.data().fichajeDni,
            fichaje.data().fichajeTrabajo,fichaje.data().fichajeObra,
            fichaje.data().fichajeEstadoEntrada,fichaje.data().fichajeEstadoSalida,
            fichaje.data().fichajeMotivoEntrada,fichaje.data().fichajeMotivoSalida,
            fichaje.data().fichajeFechaDia, fichaje.data().fichajeFechaMes,
            fichaje.data().fichajeFechaAnio, fichaje.data().fichajeHoraEntrada,
            fichaje.data().fichajeHoraSalida, fichaje.data().fichajeIdentificador
          );
        });
      });
  }

  //este metodo me sincroniza la base de datos local con la externa, y me inserta los fichajes que no se han insertado
  syncFichajesInsertar(){
    this.storage.get('fichajesInsertar').then(value => {
      console.log(JSON.stringify(value));
      if(value !== null){
        this.db.sincronizarFichajesInsertar(value);
        this.showAlert('Base de datos actualizada', 'Fichaje de entrada insertado');
        this.storage.remove('fichajesInsertar');
      }
    });
  }

  //este metodo me sincroniza la base de datos local con la externa, y me actualiza los fichajes que no se han actualizado
  syncFichajesActualizar(){
    this.storage.get('fichajesActualizar').then(value => {
      console.log(JSON.stringify(value));
      if(value !== null){
        this.db.sincronizarFichajesActualizar(value);
        this.showAlert('Base de datos actualizada', 'Fichaje de salida actualizado');
        this.storage.remove('fichajesActualizar');
      }
    });
  }

  storageActualizarFichajeNoLocalizacion(data,horaSalida,estadoSalida,motivoSalida){
    if(data){
      this.dbLocal.actualizarFichaje(horaSalida,estadoSalida,motivoSalida,data.fichajeIdentificador);
      const dato = {
        fichajeHoraSalida: horaSalida,
        fichajeEstadoSalida: estadoSalida,
        fichajeMotivoSalida: motivoSalida,
        fichajeIdentificador: data.fichajeIdentificador
      };
      this.storage.get('fichajesActualizar').then(value => {
        if(value !== null){
          value.forEach(datos =>{
            this.objetoFichaje.push(datos);
          });
          this.objetoFichaje.push(dato);
          this.storage.set('fichajesActualizar', this.objetoFichaje);
        }else{
          this.objetoFichaje.push(dato);
          this.storage.set('fichajesActualizar', this.objetoFichaje);
        }
      });
    }
  }

  //este metodo me saca las coprdenadas de la obra. Dependiendo de si hay internet o no lo hace de una manera u otra
  async sacarCoordenadasObra(){
    const network = Network.getStatus().then(data => {
      this.estado = data.connected;
      if (!this.estado) {
        this.sacarCoordenadasObraOffline();
      } else {
        this.sacarCoordenadasObraOnline();
      }
    });
  }

  async sacarCoordenadasObraOnline(){
    if(this.fichajeAbierto){
      const obra = await this.db.sacarObraPorNombre(this.textoObra);
      if(!obra.empty){
        obra.forEach(data =>{
          this.latitudObra = data.data().obraLatitud;
          this.longitudObra = data.data().obraLongitud;
        });
      }else{
        console.log('No hay obra');
      }
    }else{
      const obra = await this.db.sacarObraPorNombre(this.formulario.value.nombreObra.obraName);
      if(!obra.empty){
        obra.forEach(data =>{
          this.latitudObra = data.data().obraLatitud;
          this.longitudObra = data.data().obraLongitud;
        });
      }else{
        console.log('No hay obra');
      }
    }
  }

  sacarCoordenadasObraOffline(){
    if(this.fichajeAbierto){
      this.dbLocal.obtenerObraPorNombre(this.textoObra).then(data => {
        if(data){
          this.latitudObra = data.obraLatitud;
          this.longitudObra = data.obraLongitud;
        }
      });
    }else{
      this.dbLocal.obtenerObraPorNombre(this.formulario.value.nombreObra.obraName).then(data => {
        if(data){
          this.latitudObra = data.obraLatitud;
          this.longitudObra = data.obraLongitud;
        }
      });
    }
  }
}
