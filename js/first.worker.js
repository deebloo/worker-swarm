self.onmessage = (message) => {
  console.log("FIRST", message.data);

  switch (message.data.type) {
    case "TEST": {
      self.postMessage("Hello Back!");
    }
  }
};
