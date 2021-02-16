import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { EMPTY, fromEvent, interval, Observable, of } from 'rxjs';
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

interface OperatorObj {
  name: string;
  innerObservables: InnerObservable[];
  result: Observable<number>;
  operator: Function;
  code: string;
}

@Component({
  selector: 'app-sandbox',
  templateUrl: './sandbox.component.html',
  styleUrls: ['./sandbox.component.scss']
})
export class SandboxComponent implements OnInit{

  @ViewChild('Source') Source: ElementRef;
  source$: Observable<Event>;
  activeOperator = Operators.None;
  operatorObjects: OperatorObj[] = [
    {
      name: Operators.MergeMap,
      innerObservables: [],
      operator: mergeMap,
      result: of(0),
      code:
`
resultObservable$ = outerObservable.pipe(
  mergeMap(() => innerObservable$.pipe(
    map((innerObservableValue) => {
      return innerObservableValue * 10;
    })
  ))
).subscribe();`
    },
    {
      name: Operators.ConcatMap,
      innerObservables: [],
      operator: concatMap,
      result: of(0),
      code:
`
resultObservable$ = outerObservable.pipe(
  concatMap(() => innerObservable$.pipe(
    map((innerObservableValue) => {
      return innerObservableValue * 10;
    })
  ))
).subscribe();`
    },
    {
      name: Operators.SwitchMap,
      innerObservables: [],
      operator: switchMap,
      result: of(0),
      code:
`
resultObservable$ = outerObservable.pipe(
  switchMap(() => innerObservable$.pipe(
    map((innerObservableValue) => {
      return innerObservableValue * 10;
    })
  ))
).subscribe();`
    },
    {
      name: Operators.ExhaustMap,
      innerObservables: [],
      operator: exhaustMap,
      result: of(0),
      code:
`
resultObservable$ = outerObservable.pipe(
  exhuastMap(() => innerObservable$.pipe(
    map((innerObservableValue) => {
      return innerObservableValue * 10;
    })
  ))
).subscribe();`
    }
  ]

  ngOnInit(): void {
  }
  
  ngAfterViewInit(): void {
    this.source$ = fromEvent(this.Source.nativeElement, 'click');
    this.operatorObjects.forEach(obj => this.applyOperator(obj));
  }

  setInnerObservable(): void {
    
  }

  applyOperator(operatorObj: OperatorObj): void {
    operatorObj.result = this.source$.pipe(
      tap(() => {
        let val: number;
        let innerObj: InnerObservable;
        const inner = interval(1000).pipe(tap(data => {
          innerObj.value = data;
          innerObj.hasActiveSubcription = true;
        }), 
        take(10),
        finalize(() => {
          innerObj.hasCompleted = true;
          innerObj.hasActiveSubcription = false;
        }));
        innerObj = {obs: inner, value: val, hasActiveSubcription: false, hasCompleted: false};
        operatorObj.innerObservables.push(innerObj);
      }),
      operatorObj.operator(() => {
        const innerObservables = operatorObj.innerObservables;
        const observableIndex = innerObservables.length - 1;

        return innerObservables[observableIndex].obs.pipe(map(number => number * 10));
      })
    )
  }

  resetAll(): void {
    this.operatorObjects.map(obj => obj.innerObservables = []);
    this.operatorObjects.forEach(obj => this.applyOperator(obj));
  }
}
