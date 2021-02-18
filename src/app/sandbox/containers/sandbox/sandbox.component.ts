import { Component, ElementRef, ViewChild } from '@angular/core';
import { BehaviorSubject, fromEvent, interval, Observable, of } from 'rxjs';
import { concatMap, exhaustMap, filter, finalize, map, mergeMap, switchMap, take, tap } from 'rxjs/operators';

enum Operators {
  None = 'No operator selected',
  MergeMap = 'mergeMap',
  ConcatMap = 'concatMap',
  SwitchMap = 'switchMap',
  ExhaustMap = 'exhaustMap'
}

interface InnerObservable {
  observable: Observable<number>;
  subject?: BehaviorSubject<number>;
  value: number;
  hasActiveSubcription: boolean;
  hasCompleted: boolean;
}

interface OperatorObject {
  name: Operators;
  innerObservables: InnerObservable[];
  result: Observable<number>;
  isVisible: boolean;
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
  useSubjects = false;
  operatorObjects: OperatorObject[] = [
    {
      name: Operators.MergeMap,
      innerObservables: [],
      operator: mergeMap,
      result: of(0),
      isVisible: true
    },
    {
      name: Operators.ConcatMap,
      innerObservables: [],
      operator: concatMap,
      result: of(0),
      isVisible: false
    },
    {
      name: Operators.SwitchMap,
      innerObservables: [],
      operator: switchMap,
      result: of(0),
      isVisible: false
    },
    {
      name: Operators.ExhaustMap,
      innerObservables: [],
      operator: exhaustMap,
      result: of(0),
      isVisible: false
    }
  ]

  visibleOperators = this.operatorObjects.filter(op => op.isVisible);

  ngAfterViewInit(): void {
    this.source$ = fromEvent(this.Source.nativeElement, 'click');
    this.resetAll();
  }

  renderCode(operatorName: string): string {
    return `
    resultObservable$ = outerObservable$.pipe(
      ${operatorName}(() => innerObservable$.pipe(
        map((innerObservableValue) => {
          return innerObservableValue * ${this.mappingModifier};
        })
      ))
    ).subscribe();`
  }

  setInnerObservableType(): void {
    this.useSubjects = !this.useSubjects;
    this.resetAll();
  }

  toggleOperator(operator: OperatorObject) {
    if( this.visibleOperators.length <= 1 
      && !this.visibleOperators.findIndex((op => op.name === operator.name))) {
      return;
    }
    operator.isVisible = !operator.isVisible;
    this.visibleOperators = this.operatorObjects.filter(op => op.isVisible);
  }

  applyOperator(operatorObject: OperatorObject, isSubject: boolean): void {
    operatorObject.result = this.source$.pipe(
      tap(() => {
        if(isSubject) {
          this._createSubjectInnerObservable(operatorObject);
        } else {
          this._createIntervalInnerObservable(operatorObject);
        }
      }),
      operatorObject.operator(() => {
        const innerObservables = operatorObject.innerObservables;
        const observableIndex = innerObservables.length - 1;

        return innerObservables[observableIndex].observable.pipe(map(number => number * this.mappingModifier));
      })
    )
  }

  resetAll(): void {
    this.operatorObjects.map(obj => obj.innerObservables = []);
    this.operatorObjects.forEach(obj => this.applyOperator(obj, this.useSubjects));
  }

  private _createSubjectInnerObservable(outerObservable: OperatorObject): void {
    let value: number;
    let innerObservable: InnerObservable;
    const innerSubject$ = new BehaviorSubject(0);
    const inner$ = innerSubject$.asObservable().pipe(tap(data => {
      innerObservable.value = data;
      innerObservable.hasActiveSubcription = true;
      console.log(data);
    }), 
    finalize(() => {
      innerObservable.hasCompleted = true;
      innerObservable.hasActiveSubcription = false;
    }));
    innerObservable = {observable: inner$, subject: innerSubject$, value, hasActiveSubcription: false, hasCompleted: false};
    outerObservable.innerObservables.push(innerObservable);
  }

  private _createIntervalInnerObservable(outerObservable: OperatorObject): void {
    let value: number;
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
    innerObservable = {observable: inner, value, hasActiveSubcription: false, hasCompleted: false};
    outerObservable.innerObservables.push(innerObservable);

  }
}
