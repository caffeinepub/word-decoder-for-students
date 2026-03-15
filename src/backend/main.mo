import Text "mo:core/Text";
import Map "mo:core/Map";
import Order "mo:core/Order";
import Runtime "mo:core/Runtime";
import OutCall "http-outcalls/outcall";
import Array "mo:core/Array";

actor {
  type WordEntry = {
    word : Text;
    definition : Text;
    example : Text;
  };

  module WordEntry {
    public func compare(entry1 : WordEntry, entry2 : WordEntry) : Order.Order {
      Text.compare(entry1.word, entry2.word);
    };
  };

  let history = Map.empty<Text, WordEntry>();

  public query ({ caller }) func transform(input : OutCall.TransformationInput) : async OutCall.TransformationOutput {
    OutCall.transform(input);
  };

  func getDefinitionApiUrl(word : Text) : Text {
    "https://api.dictionaryapi.dev/api/v2/entries/en/" # word;
  };

  func addEntry(word : Text, definition : Text, example : Text) {
    let entry : WordEntry = {
      word;
      definition;
      example;
    };
    history.add(word, entry);
  };

  public shared ({ caller }) func storeWordEntry(word : Text, definition : Text, example : Text) : async () {
    addEntry(word, definition, example);
  };

  public shared ({ caller }) func lookupWord(word : Text) : async Text {
    let url = getDefinitionApiUrl(word);
    let headers : [OutCall.Header] = [
      { name = "Accept"; value = "application/json" },
      { name = "Accept-Language"; value = "en-US,en;q=0.9" },
    ];
    await OutCall.httpGetRequest(url, headers, transform);
  };

  public query ({ caller }) func getHistory() : async [WordEntry] {
    history.values().toArray();
  };

  public shared ({ caller }) func deleteEntry(word : Text) : async () {
    if (not history.containsKey(word)) {
      Runtime.trap("Word not found in history");
    };
    history.remove(word);
  };

  public shared ({ caller }) func clearHistory() : async () {
    history.clear();
  };
};
