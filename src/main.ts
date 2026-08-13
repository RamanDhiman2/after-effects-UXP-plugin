import { mountApp } from "./ui/app";

const root = document.querySelector<HTMLElement>("#plugin-root");
if (!root) throw new Error("NotFakePlugdAll root element was not found.");

mountApp(root);

