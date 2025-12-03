import { configureStore } from "@reduxjs/toolkit";
import uiReducer from "./uiSlice";
import { notificationsApi } from "./api/notificationsApi";
import { seenNotificationsListener } from "./api/seenNotificationsMiddleware";

export const store = configureStore({
  reducer: {
    ui: uiReducer,
    [notificationsApi.reducerPath]: notificationsApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware()
      .prepend(seenNotificationsListener.middleware)
      .concat(notificationsApi.middleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
