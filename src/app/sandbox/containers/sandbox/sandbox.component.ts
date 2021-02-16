import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { EMPTY, fromEvent, interval, Observable, of } from 'rxjs';
import { concatMap, exhaustMap, finalize, mergeMap, switchMap, take, tap } from 'rxjs/operators';

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

        return innerObservables[observableIndex].obs
      })
    )
  }

  resetAll(): void {
    this.operatorObjects.map(obj => obj.innerObservables = []);
    this.operatorObjects.forEach(obj => this.applyOperator(obj));
  }
}
