import { of, from } from "rxjs";
import { Epic } from "redux-observable";
import * as actions from "./actions";
import {
  catchError,
  map,
  filter,
  switchMap,
  withLatestFrom
} from "rxjs/operators";
import { ActionType, isActionOf } from "typesafe-actions";
import { appState } from "./reducer";
import { groupSegmentsByDate } from "../utilities";

type Action = ActionType<typeof actions>;
const propertyFilter = ["dt", "main", "weather", "dt_txt"]; //This array will be used to filter returned data

export const fetchWeatherSegmentsFlow: Epic<Action, Action, appState, any> = (
  action$,
  state$,
  { service }
) =>
  action$.pipe(
    filter(isActionOf(actions.getData)),
    withLatestFrom(state$),
    switchMap(() =>
      from(service.fetchDataFromAPI()).pipe(
        //Selecting only needed set of properties from returned weather segments
        map((data: any) => {
          const filtered = data.list.map((item: any) => {
            const holder: any = {};
            for (let prop in item) {
              if (propertyFilter.includes(prop)) holder[prop] = item[prop];
            }
            return holder;
          });
          return filtered;
        }),
        //Grouping weather segments by date in order to facilitate further data processing
        map(data => groupSegmentsByDate(data)),
        map(actions.setData),
        catchError(error => of(actions.dataError(error)))
      )
    )
  );
