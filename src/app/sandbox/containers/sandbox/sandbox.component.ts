import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { BehaviorSubject, from, fromEvent, interval, Observable, of, Subject, timer } from 'rxjs';
import { concatMap, exhaustMap, map, mergeMap, startWith, switchMap, take, tap } from 'rxjs/operators';

enum Operators {
  None = 'No operator selected',
  MergeMap = 'mergeMap',
  ConcatMap = 'concatMap',
  SwitchMap = 'switchMap',
  ExhaustMap = 'exhaustMap'
}

interface InnerObservable {
  obs: Observable<number>;
  value: number;
}

interface OperatorObj {
  name: string;
  innerObservables: InnerObservable[];
  result: Observable<number>;
  operator: Function;
}

@Component({
  selector: 'app-sandbox',
  templateUrl: './sandbox.component.html',
  styleUrls: ['./sandbox.component.scss']
})
export class SandboxComponent {

  @ViewChild('Source') Source: ElementRef;
  source$: Observable<Event>;
  activeOperator = Operators.None;
  operatorObjects: OperatorObj[] = [
    {
      name: Operators.MergeMap,
      innerObservables: [],
      operator: mergeMap,
      result: of(0)
    },
    {
      name: Operators.ConcatMap,
      innerObservables: [],
      operator: concatMap,
      result: of(0)
    },
    {
      name: Operators.SwitchMap,
      innerObservables: [],
      operator: switchMap,
      result: of(0)
    },
    {
      name: Operators.ExhaustMap,
      innerObservables: [],
      operator: exhaustMap,
      result: of(0)
    }
  ]
  
  ngAfterViewInit() {
    this.source$ = fromEvent(this.Source.nativeElement, 'click');
    this.operatorObjects.forEach(obj => this.applyOperator(obj));
  }

  applyOperator(operatorObj): void {
    operatorObj.result = this.source$.pipe(
      tap(() => {
        let val: number;
        let innerObj: InnerObservable;
        const inner = interval(1000).pipe(tap(data => innerObj.value = data), take(10));
        innerObj = {obs: inner, value: val};
        operatorObj.innerObservables.push(innerObj);
      }),
      operatorObj.operator(() => operatorObj.innerObservables[operatorObj.innerObservables.length - 1].obs)
    )
  }

  resetAll(): void {
    this.operatorObjects.forEach(obj => this.applyOperator(obj));
    this.operatorObjects.map(obj => obj.innerObservables = []);
  }
}
