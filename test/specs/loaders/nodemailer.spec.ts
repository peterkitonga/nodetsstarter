import ejs from 'ejs';
import chai from 'chai';
import sinon from 'sinon';
import sinonChai from 'sinon-chai';
import chaiAsPromised from 'chai-as-promised';

import Mailer from '../../../src/loaders/nodemailer';
import { ResultResponse } from '../../../src/common/interfaces/responses';

const { expect } = chai;

chai.use(sinonChai);
chai.use(chaiAsPromised);

const sandbox = sinon.createSandbox();

describe('src/loaders/nodemailer: class Mailer', () => {
  afterEach(() => {
    sandbox.restore();
  });

  context('getViewData()', () => {
    let viewData: { message: string; code: string };
    let getViewData: (view: string, dataOptions: ejs.Data) => Promise<ResultResponse<string>>;

    beforeEach(() => {
      getViewData = Mailer['getViewData'];
      viewData = { message: 'SOME MESSAGE', code: 'ootet6ro2GaenieG5Zoh' };
    });

    it('should render view with existing given name', async () => {
      const viewName = 'welcome';

      await expect(getViewData(viewName, viewData))
        .to.eventually.be.fulfilled.with.deep.property('data')
        .to.be.a('string');
    });

    it('should return error if view does not exist', async () => {
      const viewName = 'non-existing-view';

      await expect(getViewData(viewName, viewData))
        .to.eventually.be.rejected.with.deep.property('status')
        .to.equal('error');
    });

    it('should return error if any view data is missing', async () => {
      const viewName = 'welcome';

      await expect(getViewData(viewName, { message: 'SOME MESSAGE' }))
        .to.eventually.be.rejected.with.deep.property('status')
        .to.equal('error');
    });
  });

  context('send()', () => {
    let viewName: string;
    let emailAddress: string;
    let emailSubject: string;
    let sendMailStub: sinon.SinonStub;
    let viewData: { message: string; code: string };

    beforeEach(() => {
      viewName = 'welcome';
      emailSubject = 'TEST SUBJECT';
      emailAddress = 'disdegnosi@dunsoi.com'; // generated from https://emailfake.com/
      sendMailStub = sandbox.stub(Mailer['transporter'], 'sendMail');
      viewData = { message: 'SOME MESSAGE', code: 'ootet6ro2GaenieG5Zoh' };
    });

    it('should not send email if view is not found', async () => {
      viewName = 'non-existing-view';
      const sendResponse = Mailer.send(emailAddress, emailSubject, viewData, viewName);

      await expect(sendResponse).to.eventually.be.rejected.with.deep.property('status').to.equal('error');
      expect(sendMailStub).to.not.have.been.called;
    });

    it('should not send email if email is invalid', async () => {
      emailAddress = 'non-existing-email';
      const sendResponse = Mailer.send(emailAddress, emailSubject, viewData, viewName);

      await expect(sendResponse).to.eventually.be.rejected.with.deep.property('status').to.equal('error');
      expect(sendMailStub).to.have.been.calledOnce;
    });

    it('should return success message after successfully sending email', async () => {
      sendMailStub.resolves({ response: 'EMAIL SENT' });
      const sendResponse = Mailer.send(emailAddress, emailSubject, viewData, viewName);

      await expect(sendResponse).to.eventually.be.fulfilled.with.deep.property('status').to.equal('success');
      expect(sendMailStub).to.have.been.calledOnce;
    });
  });
});
