import {Text} from '@nemesis-oss/termina-core';
import {UnorderedList} from '@nemesis-oss/termina-ui';

export default function Features() {
  return (
    <UnorderedList>
      <UnorderedList.Item>
        <Text>Fast startup</Text>
      </UnorderedList.Item>

      <UnorderedList.Item>
        <Text>Keyboard input</Text>
        <UnorderedList>
          <UnorderedList.Item>
            <Text>Arrow keys</Text>
          </UnorderedList.Item>
          <UnorderedList.Item>
            <Text>Enter to submit</Text>
          </UnorderedList.Item>
        </UnorderedList>
      </UnorderedList.Item>

      <UnorderedList.Item>
        <Text>Mouse support</Text>
      </UnorderedList.Item>
    </UnorderedList>
  );
}
