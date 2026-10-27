import assert from "node:assert/strict";
import { test } from "node:test";
import { draftUrl } from "./draftUrl.ts";

const draft = {
  kind: "draftEmail",
  to: "samar+ahoy@gmail.com",
  subject: "Credits & next steps",
  body: "Hi Samar,\nCan we talk?",
  via: "mail",
} as const;

test("mail drafts open a mailto url with everything encoded", () => {
  assert.equal(
    draftUrl(draft),
    "mailto:samar%2Bahoy%40gmail.com?subject=Credits%20%26%20next%20steps&body=Hi%20Samar%2C%0ACan%20we%20talk%3F",
  );
});

test("gmail drafts open the compose page and a missing address stays empty", () => {
  assert.equal(
    draftUrl({ ...draft, to: null, via: "gmail" }),
    "https://mail.google.com/mail/?view=cm&fs=1&to=&su=Credits%20%26%20next%20steps&body=Hi%20Samar%2C%0ACan%20we%20talk%3F",
  );
});
