import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'filtro'
})
export class FiltroPipe implements PipeTransform {

  transform(array: any[], texto: string): any[] {

    if(texto === ''){
      return array;
    }else{

      texto = texto.toLowerCase();

      return array.filter(item =>{
        return item.fichajeIdentificador.toLowerCase().includes(texto);
      });
    }

  }

}
