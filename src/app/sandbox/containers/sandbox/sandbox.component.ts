import { Component, ElementRef, ViewChild } from '@angular/core';
import { BehaviorSubject, fromEvent, interval, Observable, of, Subscription } from 'rxjs';
import { concatMap, exhaustMap, filter, finalize, map, mapTo, mergeMap, scan, switchMap, take, tap } from 'rxjs/operators';

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
  definition: string;
  operator: Function;
}

@Component({
  selector: 'app-sandbox',
  templateUrl: './sandbox.component.html',
  styleUrls: ['./sandbox.component.scss']
})
export class SandboxComponent {

  @ViewChild('OuterEvent') Source: ElementRef;
  outerEvent$: Observable<Event>;
  ones$: Observable<number>;
  outerObservableCount$: Observable<number>;
  activeOperator = Operators.None;
  intervalTime = 800;
  intervalAmount = 10;
  mappingModifier = 10;
  useSubjects = false;
  showCode = false;
  showMarble = false;
  showDefinition = true;
  operatorObjects: OperatorObject[] = [
    {
      name: Operators.MergeMap,
      innerObservables: [],
      operator: mergeMap,
      result: of(0),
      isVisible: true,
      definition: "Projects each source value to an Observable which is merged in the output Observable."
    },
    {
      name: Operators.ConcatMap,
      innerObservables: [],
      operator: concatMap,
      result: of(0),
      isVisible: false,
      definition: 'Projects each source value to an Observable which is merged in the output Observable, in a serialized fashion waiting for each one to complete before merging the next.'
    },
    {
      name: Operators.SwitchMap,
      innerObservables: [],
      operator: switchMap,
      result: of(0),
      isVisible: false,
      definition: 'Projects each source value to an Observable which is merged in the output Observable, emitting values only from the most recently projected Observable.'
    },
    {
      name: Operators.ExhaustMap,
      innerObservables: [],
      operator: exhaustMap,
      result: of(0),
      isVisible: false,
      definition: 'Projects each source value to an Observable which is merged in the output Observable only if the previous projected Observable has completed.'
    }
  ]

  visibleOperators = this.operatorObjects.filter(op => op.isVisible);

  ngAfterViewInit(): void {
    this.outerEvent$ = fromEvent(this.Source.nativeElement, 'click');
    this.ones$ = this.outerEvent$.pipe(mapTo(1));
    this.outerObservableCount$ = this.ones$.pipe(scan((acc, one) => acc + one, 0));
    this.resetAll();
  }

  renderCode(operatorName: string): string {
    return `
    resultObservable$ = outerObservable$.pipe(
      ${operatorName}((outerObservableValue) => {
        innerObservable$.pipe(
          map((innerObservableValue) => {
            return outerObservableValue * innerObservableValue;
          })
        )
      }).subscribe();`
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

  applyOperator(operatorObject: OperatorObject): void {

    operatorObject.result = this.outerObservableCount$.pipe(
      tap(() => {
        if(this.useSubjects) {
          this._createSubjectInnerObservable(operatorObject);
        } else {
          this._createIntervalInnerObservable(operatorObject);
        }
      }),
      operatorObject.operator((outerObservableCount) => {
        const innerObservables = operatorObject.innerObservables;
        const observableIndex = innerObservables.length - 1;

        return innerObservables[observableIndex].observable.pipe(map(number => number * outerObservableCount));
      })
    )
  }

  resetAll(): void {
    this.outerObservableCount$ = this.ones$.pipe(scan((acc, one) => acc + one, 0));
    this.operatorObjects.map(obj => obj.innerObservables = []);
    this.operatorObjects.forEach(obj => this.applyOperator(obj));
  }

  private _createSubjectInnerObservable(outerObservable: OperatorObject): void {
    let value: number;
    let innerObservable: InnerObservable;
    const innerSubject$ = new BehaviorSubject(0);
    const inner$ = innerSubject$.asObservable().pipe(tap(data => {
      innerObservable.value = data;
      innerObservable.hasActiveSubcription = true;
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
