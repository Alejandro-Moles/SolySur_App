import { Injectable } from '@angular/core';
import {
  atan2, chain, derivative, e, evaluate, log, pi, pow, round, sqrt, sin,cos
} from 'mathjs';

@Injectable({
  providedIn: 'root'
})
export class CalculaDistanciaService {

  radioTierra = 6378.0;

  constructor(
  ) { }

  //obra es el destino, trabajador es el origen
  sacarDistancia(longitudObra,longitudTrabajador,latitudObra,latitudTrabajador){

    const diferenciaLongitudes = pi/180 * (longitudObra -longitudTrabajador );
    const diferenciaLatitudes = pi/180 * (latitudObra - latitudTrabajador );

    const latOpe = pow(sin(diferenciaLatitudes/2), 2);
    const latOri = cos((pi/180)*latitudTrabajador);
    const latDes = cos((pi/180)*latitudObra);
    const longOpe = pow(sin(diferenciaLongitudes / 2), 2);

    // @ts-ignore
    const calculoA = latOpe + latOri * latDes * longOpe;

    const calculoC = 2 * atan2(sqrt(calculoA),sqrt(1 -calculoA));

    return this.radioTierra * calculoC;
  }
}
