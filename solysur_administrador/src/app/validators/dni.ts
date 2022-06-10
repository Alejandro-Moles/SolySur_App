import {Directive} from '@angular/core';
import {NG_VALIDATORS, Validator, ValidatorFn, AbstractControl} from '@angular/forms';

// eslint-disable-next-line prefer-arrow/prefer-arrow-functions
export function dniValidation(): ValidatorFn{
  return (control: AbstractControl) => {
    const dniValidationDirective = new DniValidationDirective();
    return dniValidationDirective.validate(control);
  };
}

export class DniValidationDirective implements Validator{
  validate(control: import('@angular/forms').AbstractControl): import('@angular/forms').ValidationErrors{
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    const dni = <string>control.value;

    if(!dni){return;}
    if(dni.length < 8 || dni.length > 8){
      return {dniValidation: {message: 'El dni requiere de 8 digitos numéricos'}};
    }

  }

}
