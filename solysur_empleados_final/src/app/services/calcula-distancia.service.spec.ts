import { TestBed } from '@angular/core/testing';

import { CalculaDistanciaService } from './calcula-distancia.service';

describe('CalculaDistanciaService', () => {
  let service: CalculaDistanciaService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CalculaDistanciaService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
