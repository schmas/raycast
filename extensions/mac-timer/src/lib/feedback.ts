import { showHUD, showToast, Toast } from "@raycast/api";

export async function success(message: string): Promise<void> {
  await showHUD(message);
}

export async function failure(title: string, detail?: string): Promise<void> {
  await showToast({
    style: Toast.Style.Failure,
    title,
    message: detail,
  });
}
