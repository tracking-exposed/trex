/* eslint-disable no-console */

export const registerAutomation = async({
  type,
  file,
  comment,
  label,
}: {
  type: string;
  file: string;
  comment?: string;
  label?: string;
}): Promise<void> => {
  console.log(`Registering automation for "${type}"...`);
};

export default registerAutomation;
