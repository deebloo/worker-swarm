self.onmessage = (message) => {
  console.log("SECOND", message.data);

  switch (message.data.type) {
    case "TEST": {
      self.postMessage("Hello Back!");
    }
  }
};
