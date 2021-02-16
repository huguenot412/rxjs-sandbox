import { Component, ElementRef, ViewChild } from '@angular/core';
import { fromEvent, interval, Observable, of } from 'rxjs';
import { concatMap, exhaustMap, finalize, map, mergeMap, switchMap, take, tap } from 'rxjs/operators';

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
  hasActiveSubcription: boolean;
  hasCompleted: boolean;
}

interface OperatorObject {
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
  intervalTime = 1000;
  intervalAmount = 10;
  mappingModifier = 10;
  operatorObjects: OperatorObject[] = [
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

  ngAfterViewInit(): void {
    this.source$ = fromEvent(this.Source.nativeElement, 'click');
    this.operatorObjects.forEach(obj => this.applyOperator(obj));
  }

  renderCode(operatorName: string): string {
    return `
    resultObservable$ = outerObservable.pipe(
      ${operatorName}(() => innerObservable$.pipe(
        map((innerObservableValue) => {
          return innerObservableValue * ${this.mappingModifier};
        })
      ))
    ).subscribe();`
  }

  applyOperator(operatorObject: OperatorObject): void {
    operatorObject.result = this.source$.pipe(
      tap(() => {
        let val: number;
        let innerObservable: InnerObservable;
        const inner = interval(this.intervalTime).pipe(tap(data => {
          innerObservable.value = data;
          innerObservable.hasActiveSubcription = true;
        }), 
        take(this.intervalAmount),
        finalize(() => {
          innerObservable.hasCompleted = true;
          innerObservable.hasActiveSubcription = false;
        }));
        innerObservable = {obs: inner, value: val, hasActiveSubcription: false, hasCompleted: false};
        operatorObject.innerObservables.push(innerObservable);
      }),
      operatorObject.operator(() => {
        const innerObservables = operatorObject.innerObservables;
        const observableIndex = innerObservables.length - 1;

        return innerObservables[observableIndex].obs.pipe(map(number => number * this.mappingModifier));
      })
    )
  }

  resetAll(): void {
    this.operatorObjects.map(obj => obj.innerObservables = []);
    this.operatorObjects.forEach(obj => this.applyOperator(obj));
  }
}
