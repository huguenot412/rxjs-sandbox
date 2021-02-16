import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SandboxComponent } from './containers/sandbox/sandbox.component';
import { SandboxRoutingModule } from './sandbox-routding.module';



@NgModule({
  declarations: [SandboxComponent],
  imports: [
    CommonModule,
    SandboxRoutingModule,
    FormsModule
  ]
})
export class SandboxModule { }
