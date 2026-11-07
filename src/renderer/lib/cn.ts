import { createCn } from "cn/config";

// Custom font sizes look like text colours to the merger, so without this
// a size class silently drops the colour class beside it.
export const cn = createCn({
  extend: {
    classGroups: {
      "font-size": [
        {
          text: [
            "micro",
            "label",
            "caption",
            "ui",
            "body-sm",
            "dialog-title",
            "dialog-body",
            "row",
            "card-title",
            "title",
            "setup",
            "reveal",
            "heard",
            "entry",
            "entry-heard",
            "entry-heard-long",
            "summary",
            "question",
            "outcome",
          ],
        },
      ],
    },
  },
});
