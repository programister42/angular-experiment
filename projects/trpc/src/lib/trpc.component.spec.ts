import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TrpcComponent } from './trpc.component';

describe('TrpcComponent', () => {
  let component: TrpcComponent;
  let fixture: ComponentFixture<TrpcComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TrpcComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TrpcComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
